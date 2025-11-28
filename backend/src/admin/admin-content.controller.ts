import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../common/guards/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentType } from '../typing/content.entity';
import { splitText, previewSplit } from '../common/utils/text-splitter';

@Controller('admin/content')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminContentController {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  @Get('list')
  async listContent(
    @Query('type') contentType?: ContentType,
    @Query('workTitle') workTitle?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (contentType) {
      where.contentType = contentType;
    }
    if (workTitle) {
      where.workTitle = workTitle;
    }

    const [items, total] = await this.contentRepository.findAndCount({
      where,
      order: { workTitle: 'ASC', chapter: 'ASC', section: 'ASC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('works')
  async listWorks(@Query('type') contentType?: ContentType) {
    const WARNING_LENGTH = 200;

    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .select('content.workTitle', 'workTitle')
      .addSelect('content.author', 'author')
      .addSelect('content.contentType', 'contentType')
      .addSelect('content.publicationYear', 'publicationYear')
      .addSelect('BOOL_OR(content.isActive)', 'isActive')
      .addSelect('COUNT(*)', 'sectionCount')
      .addSelect(`SUM(CASE WHEN LENGTH(content.content) > ${WARNING_LENGTH} THEN 1 ELSE 0 END)`, 'longSectionCount')
      .groupBy('content.workTitle')
      .addGroupBy('content.author')
      .addGroupBy('content.contentType')
      .addGroupBy('content.publicationYear')
      .orderBy('content.workTitle', 'ASC');

    if (contentType) {
      queryBuilder.where('content.contentType = :contentType', { contentType });
    }

    const works = await queryBuilder.getRawMany();

    return works.map(work => ({
      ...work,
      longSectionCount: parseInt(work.longSectionCount) || 0,
    }));
  }

  @Get(':id')
  async getContent(@Param('id') id: string) {
    return this.contentRepository.findOne({ where: { id } });
  }

  @Post()
  async createContent(@Body() body: {
    contentType: ContentType;
    workTitle: string;
    author?: string;
    chapter: number;
    section: number;
    content: string;
    displayReference?: string;
    publicationYear?: number;
  }) {
    const content = this.contentRepository.create(body);
    return this.contentRepository.save(content);
  }

  @Put(':id')
  async updateContent(
    @Param('id') id: string,
    @Body() body: Partial<Content>,
  ) {
    await this.contentRepository.update(id, body);
    return this.contentRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteContent(@Param('id') id: string) {
    // Get the content to be deleted
    const contentToDelete = await this.contentRepository.findOne({ where: { id } });

    if (!contentToDelete) {
      return { success: false, message: 'Content not found' };
    }

    // Delete the content
    await this.contentRepository.delete(id);

    // Renumber sections: decrease section number for all sections after the deleted one
    await this.contentRepository
      .createQueryBuilder()
      .update(Content)
      .set({ section: () => 'section - 1' })
      .where('workTitle = :workTitle', { workTitle: contentToDelete.workTitle })
      .andWhere('author = :author', { author: contentToDelete.author })
      .andWhere('chapter = :chapter', { chapter: contentToDelete.chapter })
      .andWhere('section > :section', { section: contentToDelete.section })
      .execute();

    // Update display_reference for renumbered sections
    const renumberedSections = await this.contentRepository.find({
      where: {
        workTitle: contentToDelete.workTitle,
        author: contentToDelete.author,
        chapter: contentToDelete.chapter,
      },
      order: { section: 'ASC' },
    });

    for (const section of renumberedSections) {
      const displayRef = contentToDelete.contentType === ContentType.POEM
        ? `${section.workTitle} ${section.section}연`
        : `${section.workTitle} ${section.section}문단`;

      await this.contentRepository.update(section.id, { displayReference: displayRef });
    }

    return {
      success: true,
      renumbered: renumberedSections.length,
      deletedSection: contentToDelete.section
    };
  }

  @Delete('work/:workTitle')
  async deleteWork(@Param('workTitle') workTitle: string) {
    const result = await this.contentRepository.delete({ workTitle });
    return { success: (result.affected || 0) > 0, deleted: result.affected || 0 };
  }

  @Put('work/:workTitle/toggle')
  async toggleWorkActive(@Param('workTitle') workTitle: string) {
    const works = await this.contentRepository.find({ where: { workTitle } });

    if (works.length === 0) {
      return { success: false, message: 'Work not found' };
    }

    const newActiveState = !works[0].isActive;

    await this.contentRepository.update({ workTitle }, { isActive: newActiveState });

    return {
      success: true,
      isActive: newActiveState,
      updated: works.length
    };
  }

  @Post('preview-split')
  async previewTextSplit(@Body() body: { text: string; maxLength?: number }) {
    const { text, maxLength = 150 } = body;
    return previewSplit(text, { maxLength });
  }

  @Post('bulk')
  async bulkCreateContent(@Body() body: {
    contentType: ContentType;
    workTitle: string;
    author?: string;
    chapter: number;
    content: string;
    publicationYear?: number;
    maxLength?: number;
  }) {
    const { contentType, workTitle, author, chapter, content, publicationYear, maxLength = 150 } = body;

    // Split the text into segments
    const segments = splitText(content, { maxLength });

    if (segments.length === 0) {
      return { success: false, message: 'No content to create', createdCount: 0 };
    }

    // Find the current max section for this work/chapter
    const existingSections = await this.contentRepository.find({
      where: { workTitle, chapter },
      order: { section: 'DESC' },
      take: 1,
    });

    const startSection = existingSections.length > 0 ? existingSections[0].section + 1 : 1;

    // Helper to generate displayReference
    const getDisplayReference = (sectionNum: number) => {
      if (contentType === ContentType.POEM) {
        return `${sectionNum}연`;
      }
      return `${sectionNum}문단`;
    };

    // Create all content entries
    const newContents = segments.map((segmentText, index) => {
      const sectionNum = startSection + index;
      return this.contentRepository.create({
        contentType,
        workTitle,
        author,
        chapter,
        section: sectionNum,
        content: segmentText,
        displayReference: getDisplayReference(sectionNum),
        publicationYear,
        isPublicDomain: true,
        isActive: true,
      });
    });

    await this.contentRepository.save(newContents);

    return {
      success: true,
      createdCount: newContents.length,
      startSection,
      endSection: startSection + newContents.length - 1,
    };
  }

  @Post('split')
  async splitContent(@Body() body: {
    contentId: string;
    maxLength?: number;
  }) {
    const { contentId, maxLength = 150 } = body;

    // 원본 콘텐츠 조회
    const original = await this.contentRepository.findOne({ where: { id: contentId } });

    if (!original) {
      return { success: false, message: 'Content not found' };
    }

    // 이미 적절한 길이면 분할 불필요
    if (original.content.length <= maxLength) {
      return { success: false, message: 'Content is already short enough', length: original.content.length };
    }

    // 텍스트 분할
    const segments = splitText(original.content, { maxLength });

    if (segments.length <= 1) {
      return { success: false, message: 'Cannot split content meaningfully' };
    }

    // 트랜잭션으로 처리
    const queryRunner = this.contentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 첫 번째 세그먼트로 원본 업데이트
      await queryRunner.manager.update(Content, original.id, {
        content: segments[0],
      });

      // 나머지 세그먼트들을 같은 챕터의 새 섹션으로 추가
      // 먼저 기존 섹션들의 번호를 뒤로 밀기
      const sectionsToShift = await queryRunner.manager.find(Content, {
        where: {
          workTitle: original.workTitle,
          chapter: original.chapter,
        },
        order: { section: 'DESC' },
      });

      // displayReference 형식 결정 (기존 형식 유지)
      const getDisplayReference = (sectionNum: number) => {
        if (original.contentType === 'poem') {
          return `${sectionNum}연`;
        }
        return `${sectionNum}문단`;
      };

      // 뒤로 밀릴 섹션들의 번호와 displayReference 업데이트
      for (const existingSection of sectionsToShift) {
        if (existingSection.section > original.section) {
          const newSectionNum = existingSection.section + segments.length - 1;
          await queryRunner.manager.update(Content, existingSection.id, {
            section: newSectionNum,
            displayReference: getDisplayReference(newSectionNum),
          });
        }
      }

      // 새 세그먼트들 삽입
      for (let i = 1; i < segments.length; i++) {
        const newSectionNum = original.section + i;
        const newSection = queryRunner.manager.create(Content, {
          contentType: original.contentType,
          workTitle: original.workTitle,
          author: original.author,
          chapter: original.chapter,
          section: newSectionNum,
          content: segments[i],
          displayReference: getDisplayReference(newSectionNum),
          publicationYear: original.publicationYear,
          isPublicDomain: original.isPublicDomain,
          isActive: original.isActive,
        });
        await queryRunner.manager.save(newSection);
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        originalLength: original.content.length,
        segmentCount: segments.length,
        newSections: segments.slice(1).map((seg, idx) => ({
          section: original.section + idx + 1,
          length: seg.length,
        })),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
