import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Repository, DataSource } from 'typeorm';
import { Content } from '../typing/content.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { splitText } from '../common/utils/text-splitter';
import * as readline from 'readline';

const MAX_LENGTH = 200; // 이 길이를 초과하는 콘텐츠만 분할
const RECOMMENDED_LENGTH = 150; // 분할 시 권장 최대 길이

async function askForConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question + ' (y/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function splitLongContent() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contentRepository = app.get<Repository<Content>>(getRepositoryToken(Content));
  const dataSource = app.get<DataSource>(DataSource);

  console.log('🔍 긴 콘텐츠 검색 중...\n');

  // 긴 콘텐츠 찾기
  const longContents = await contentRepository
    .createQueryBuilder('content')
    .where('LENGTH(content.content) > :maxLength', { maxLength: MAX_LENGTH })
    .orderBy('content.workTitle', 'ASC')
    .addOrderBy('content.chapter', 'ASC')
    .addOrderBy('content.section', 'ASC')
    .getMany();

  if (longContents.length === 0) {
    console.log('✅ 분할이 필요한 긴 콘텐츠가 없습니다.');
    await app.close();
    return;
  }

  console.log(`📋 총 ${longContents.length}개의 긴 콘텐츠를 발견했습니다.\n`);

  // 통계 출력
  const byWork = longContents.reduce((acc, content) => {
    const key = content.workTitle;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(content);
    return acc;
  }, {} as Record<string, typeof longContents>);

  console.log('📚 작품별 분할 대상:');
  for (const [workTitle, items] of Object.entries(byWork)) {
    console.log(`  - ${workTitle}: ${items.length}개 문단`);
  }

  console.log('\n');

  // 사용자 확인
  const proceed = await askForConfirmation(
    `${longContents.length}개의 콘텐츠를 자동으로 분할하시겠습니까?`
  );

  if (!proceed) {
    console.log('❌ 작업이 취소되었습니다.');
    await app.close();
    return;
  }

  console.log('\n🔄 분할 작업 시작...\n');

  let successCount = 0;
  let failCount = 0;
  let totalNewSections = 0;

  for (const content of longContents) {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 텍스트 분할
      const segments = splitText(content.content, { maxLength: RECOMMENDED_LENGTH });

      if (segments.length <= 1) {
        console.log(
          `  ⚠️  [${content.workTitle} ${content.chapter}:${content.section}] 분할 실패 (의미있는 분할 불가)`
        );
        failCount++;
        await queryRunner.rollbackTransaction();
        continue;
      }

      console.log(
        `  📝 [${content.workTitle} ${content.chapter}:${content.section}] ${content.content.length}자 → ${segments.length}개 문단`
      );

      // 첫 번째 세그먼트로 원본 업데이트
      await queryRunner.manager.update(Content, content.id, {
        content: segments[0],
      });

      // 같은 챕터의 뒤에 있는 섹션들 번호 뒤로 밀기
      const sectionsToShift = await queryRunner.manager.find(Content, {
        where: {
          workTitle: content.workTitle,
          chapter: content.chapter,
        },
        order: { section: 'DESC' },
      });

      for (const existingSection of sectionsToShift) {
        if (existingSection.section > content.section) {
          await queryRunner.manager.update(Content, existingSection.id, {
            section: existingSection.section + segments.length - 1,
          });
        }
      }

      // 새 세그먼트들 삽입
      for (let i = 1; i < segments.length; i++) {
        const suffix = content.contentType === 'poem' ? '연' : '문단';
        const newSection = queryRunner.manager.create(Content, {
          contentType: content.contentType,
          workTitle: content.workTitle,
          author: content.author,
          chapter: content.chapter,
          section: content.section + i,
          content: segments[i],
          displayReference: `${content.workTitle} ${content.chapter}장 ${content.section + i}${suffix}`,
          publicationYear: content.publicationYear,
          isPublicDomain: content.isPublicDomain,
          isActive: content.isActive,
        });
        await queryRunner.manager.save(newSection);
        totalNewSections++;
      }

      await queryRunner.commitTransaction();
      successCount++;
    } catch (error) {
      console.log(
        `  ❌ [${content.workTitle} ${content.chapter}:${content.section}] 에러:`,
        error instanceof Error ? error.message : error
      );
      await queryRunner.rollbackTransaction();
      failCount++;
    } finally {
      await queryRunner.release();
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 분할 작업 완료!\n');
  console.log(`📊 결과:`);
  console.log(`  - 성공: ${successCount}개`);
  console.log(`  - 실패: ${failCount}개`);
  console.log(`  - 새로 생성된 문단: ${totalNewSections}개`);
  console.log(`  - 총 문단 수 변화: ${longContents.length}개 → ${successCount + totalNewSections}개`);
  console.log('='.repeat(80));

  await app.close();
}

splitLongContent().catch((error) => {
  console.error('❌ 에러 발생:', error);
  process.exit(1);
});
