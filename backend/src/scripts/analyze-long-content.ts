import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Repository } from 'typeorm';
import { Content } from '../typing/content.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function analyzeLongContent() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contentRepository = app.get<Repository<Content>>(getRepositoryToken(Content));

  console.log('📊 긴 콘텐츠 분석 시작...\n');

  // 권장 길이 기준
  const RECOMMENDED_LENGTH = 150;
  const WARNING_LENGTH = 200;
  const MAX_LENGTH = 300;

  // 전체 콘텐츠 조회
  const allContents = await contentRepository.find({
    order: { contentType: 'ASC', workTitle: 'ASC', chapter: 'ASC', section: 'ASC' },
  });

  console.log(`전체 콘텐츠 수: ${allContents.length}\n`);

  // 길이별 분류
  const stats = {
    optimal: 0,
    warning: 0,
    tooLong: 0,
    total: allContents.length,
  };

  const longContents: Array<{
    id: string;
    contentType: string;
    workTitle: string;
    chapter: number;
    section: number;
    length: number;
    displayReference: string;
  }> = [];

  for (const content of allContents) {
    const length = content.content.length;

    if (length <= RECOMMENDED_LENGTH) {
      stats.optimal++;
    } else if (length <= WARNING_LENGTH) {
      stats.warning++;
    } else {
      stats.tooLong++;
      longContents.push({
        id: content.id,
        contentType: content.contentType,
        workTitle: content.workTitle,
        chapter: content.chapter,
        section: content.section,
        length,
        displayReference: content.displayReference || `${content.workTitle} ${content.chapter}:${content.section}`,
      });
    }
  }

  // 결과 출력
  console.log('📈 통계:');
  console.log(`  ✅ 적정 길이 (≤${RECOMMENDED_LENGTH}자): ${stats.optimal} (${((stats.optimal / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  ⚠️  경고 (${RECOMMENDED_LENGTH + 1}-${WARNING_LENGTH}자): ${stats.warning} (${((stats.warning / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  🚨 너무 긴 (>${WARNING_LENGTH}자): ${stats.tooLong} (${((stats.tooLong / stats.total) * 100).toFixed(1)}%)\n`);

  if (longContents.length > 0) {
    console.log('🚨 분할이 권장되는 긴 콘텐츠:');
    console.log('─'.repeat(100));

    // 콘텐츠 타입별로 그룹화
    const byType = longContents.reduce((acc, item) => {
      if (!acc[item.contentType]) {
        acc[item.contentType] = [];
      }
      acc[item.contentType].push(item);
      return acc;
    }, {} as Record<string, typeof longContents>);

    for (const [type, items] of Object.entries(byType)) {
      console.log(`\n[${type.toUpperCase()}] - ${items.length}개`);

      // 작품별로 그룹화
      const byWork = items.reduce((acc, item) => {
        if (!acc[item.workTitle]) {
          acc[item.workTitle] = [];
        }
        acc[item.workTitle].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      for (const [workTitle, workItems] of Object.entries(byWork)) {
        console.log(`  📖 ${workTitle}: ${workItems.length}개 문단`);
        for (const item of workItems.slice(0, 5)) { // 최대 5개만 표시
          console.log(`     - ${item.displayReference}: ${item.length}자`);
        }
        if (workItems.length > 5) {
          console.log(`     ... 외 ${workItems.length - 5}개`);
        }
      }
    }

    console.log('\n' + '─'.repeat(100));
    console.log(`\n💡 권장사항: ${longContents.length}개의 긴 콘텐츠를 분할하는 것을 권장합니다.`);
    console.log(`   - 자동 분할 스크립트 실행: npm run migrate:split-long-content`);
  } else {
    console.log('✅ 모든 콘텐츠가 적절한 길이입니다.');
  }

  // 평균 길이 계산
  const avgLength = allContents.reduce((sum, c) => sum + c.content.length, 0) / allContents.length;
  console.log(`\n📏 평균 콘텐츠 길이: ${avgLength.toFixed(1)}자`);

  await app.close();
}

analyzeLongContent().catch((error) => {
  console.error('❌ 에러 발생:', error);
  process.exit(1);
});
