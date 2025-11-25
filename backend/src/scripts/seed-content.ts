import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Content types enum (must match entity)
enum ContentType {
    BIBLE = 'bible',
    NOVEL = 'novel',
    POEM = 'poem',
    ESSAY = 'essay',
}

interface BibleVerse {
    chapter: number;
    verse: number;
    name: string;
    text: string;
}

interface BibleChapter {
    chapter: number;
    name: string;
    verses: BibleVerse[];
}

interface BibleBook {
    nr: number;
    name: string;
    chapters: BibleChapter[];
}

interface BibleData {
    translation: string;
    abbreviation: string;
    description: string;
    lang: string;
    language: string;
    books: BibleBook[];
}

async function seedContent() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5632'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'bibliy',
    });

    await dataSource.initialize();
    console.log('Database connected');

    // Create content_type enum if not exists
    await dataSource.query(`
        DO $$ BEGIN
            CREATE TYPE content_type AS ENUM ('bible', 'novel', 'poem', 'essay');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `);

    // Create content table if not exists
    await dataSource.query(`
        CREATE TABLE IF NOT EXISTS content (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content_type content_type NOT NULL,
            work_title VARCHAR(255) NOT NULL,
            author VARCHAR(255),
            chapter INT DEFAULT 1,
            section INT DEFAULT 1,
            content TEXT NOT NULL,
            display_reference VARCHAR(255),
            publication_year INT,
            is_public_domain BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(content_type, work_title, chapter, section)
        );
    `);
    console.log('Content table ready');

    // Clear existing content data
    await dataSource.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
    console.log('Cleared existing content data');

    let totalItems = 0;

    // ========== SEED BIBLE DATA ==========
    const bibleJsonPath = path.join(__dirname, '../../korean_bible.json');
    if (fs.existsSync(bibleJsonPath)) {
        console.log('\n📖 Seeding Bible data...');
        const rawData = fs.readFileSync(bibleJsonPath, 'utf-8');
        const bibleData: BibleData = JSON.parse(rawData);

        for (const book of bibleData.books) {
            const bookName = book.name;

            for (const chapter of book.chapters) {
                const chapterNum = chapter.chapter;
                const values: string[] = [];
                const params: any[] = [];
                let paramIndex = 1;

                for (const verse of chapter.verses) {
                    const displayRef = `${bookName} ${chapterNum}:${verse.verse}`;
                    values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
                    params.push(
                        ContentType.BIBLE,
                        bookName,
                        chapterNum,
                        verse.verse,
                        verse.text.trim(),
                        displayRef
                    );
                    paramIndex += 6;
                    totalItems++;
                }

                if (values.length > 0) {
                    await dataSource.query(
                        `INSERT INTO content (content_type, work_title, chapter, section, content, display_reference) VALUES ${values.join(', ')}`,
                        params
                    );
                }
            }
            console.log(`  ✓ ${bookName}`);
        }
    }

    // ========== SEED KOREAN LITERATURE ==========
    console.log('\n📚 Seeding Korean literature...');

    // 김소월 - 진달래꽃 (1902-1934, 저작권 만료)
    const poems = [
        {
            title: '진달래꽃',
            author: '김소월',
            year: 1925,
            stanzas: [
                '나 보기가 역겨워\n가실 때에는\n말없이 고이 보내 드리우리다',
                '영변에 약산\n진달래꽃\n아름 따다 가실 길에 뿌리우리다',
                '가시는 걸음 걸음\n놓인 그 꽃을\n사뿐히 즈려밟고 가시옵소서',
                '나 보기가 역겨워\n가실 때에는\n죽어도 아니 눈물 흘리우리다',
            ]
        },
        {
            title: '엄마야 누나야',
            author: '김소월',
            year: 1922,
            stanzas: [
                '엄마야 누나야 강변 살자\n뜰에는 반짝이는 금모래 빛',
                '뒷문 밖에는 갈잎의 노래\n엄마야 누나야 강변 살자',
            ]
        },
        {
            title: '산유화',
            author: '김소월',
            year: 1925,
            stanzas: [
                '산에는 꽃 피네\n꽃이 피네\n갈 봄 여름 없이\n꽃이 피네',
                '산에\n산에\n피는 꽃은\n저만치 혼자서 피어 있네',
                '산에서 우는 작은 새여\n꽃이 좋아\n산에서\n사노라네',
                '산에는 꽃 지네\n꽃이 지네\n갈 봄 여름 없이\n꽃이 지네',
            ]
        },
        // 윤동주 (1917-1945, 저작권 만료 2015년)
        {
            title: '서시',
            author: '윤동주',
            year: 1941,
            stanzas: [
                '죽는 날까지 하늘을 우러러\n한 점 부끄럼이 없기를,\n잎새에 이는 바람에도\n나는 괴로워했다.',
                '별을 노래하는 마음으로\n모든 죽어 가는 것을 사랑해야지\n그리고 나한테 주어진 길을\n걸어가야겠다.',
                '오늘 밤에도 별이 바람에 스치운다.',
            ]
        },
        {
            title: '별 헤는 밤',
            author: '윤동주',
            year: 1941,
            stanzas: [
                '계절이 지나가는 하늘에는\n가을로 가득 차 있습니다.',
                '나는 아무 걱정도 없이\n가을 속의 별들을 다 헤일 듯합니다.',
                '가슴 속에 하나 둘 새겨지는 별을\n이제 다 못 헤는 것은\n쉬이 아침이 오는 까닭이요,\n내일 밤이 남은 까닭이요,\n아직 나의 청춘이 다하지 않은 까닭입니다.',
            ]
        },
        // 한용운 (1879-1944, 저작권 만료 2014년)
        {
            title: '님의 침묵',
            author: '한용운',
            year: 1926,
            stanzas: [
                '님은 갔습니다. 아아, 사랑하는 나의 님은 갔습니다.',
                '푸른 산빛을 깨치고 단풍나무 숲을 향하여 난 작은 길을 걸어서, 차마 떨치고 갔습니다.',
                '황금의 꽃같이 굳고 빛나던 옛 맹세는 차디찬 티끌이 되어서 한숨의 미풍에 날아갔습니다.',
                '날카로운 첫 키스의 추억은 나의 운명의 지침을 돌려 놓고, 뒷걸음쳐서 사라졌습니다.',
                '나는 향기로운 님의 말소리에 귀먹고, 꽃다운 님의 얼굴에 눈멀었습니다.',
                '사랑도 사람의 일이라, 만날 때에 미리 떠날 것을 염려하고 경계하지 아니한 것은 아니지만, 이별은 뜻밖의 일이 되고, 놀란 가슴은 새로운 슬픔에 터집니다.',
            ]
        },
    ];

    for (const poem of poems) {
        for (let i = 0; i < poem.stanzas.length; i++) {
            const displayRef = `${poem.title} ${i + 1}연`;
            await dataSource.query(
                `INSERT INTO content (content_type, work_title, author, chapter, section, content, display_reference, publication_year)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [ContentType.POEM, poem.title, poem.author, 1, i + 1, poem.stanzas[i], displayRef, poem.year]
            );
            totalItems++;
        }
        console.log(`  ✓ ${poem.author} - ${poem.title}`);
    }

    // ========== SEED NOVELS ==========
    // 현진건 - 운수 좋은 날 (1900-1943, 저작권 만료 2013년)
    const novels = [
        {
            title: '운수 좋은 날',
            author: '현진건',
            year: 1924,
            paragraphs: [
                '새침하게 흐린 품이 눈이 올 듯하더니 눈은 아니 오고 얼다가 만 비가 추적추적 내리었다.',
                '이날이야말로 동소문 안에서 인력거꾼 노릇을 하는 김 첨지에게는 오래간만에도 닥친 운수 좋은 날이었다.',
                '문안에(거기도 문안이니) 들어간답시는 앞집 마나님을 전차 정류장에서 곧 태워다 주기로 되었다.',
                '첫 번에 삼십 전, 둘째 번에 오십 전 - Loss일 해를 통틀어 돈을 이렇게 만이 버는 이도 처음이거니와 번 것을 위하여 이렇게 흥이 난 이도 처음이었다.',
                '그야말로 재수가 옴붙어서 근 열흘 동안 벌어 보지 못한 삯을, 그것도 하루 낮밤이 아니라 따끈한 밤참을 물도 좋다 하고 정거장을 몇 번 통행하며 모두 얼마 동안에 번 것인지도 모르는 팔자요, 신이 났다.',
            ]
        },
        {
            title: '빈처',
            author: '현진건',
            year: 1921,
            paragraphs: [
                '나는 밤마다 아내의 잠꼬대 소리에 잠을 깬다.',
                '열 남은 살을 해로해 온 아내, 아직까지 사랑의 불길이 남아 있어 달콤히 견딜 수 있지마는, 그래도 눈에 눈물이 고이도록 섭섭함을 느낀다.',
                '서울 올라와 고학을 한 지 어언 십 년이 넘었다.',
                '그 사이에 결혼도 했고 아이도 몇이나 낳았다.',
                '하지만 가난이라는 것은 좀처럼 우리 집을 떠나지 않았다.',
            ]
        },
        // 김유정 - 동백꽃 (1908-1937, 저작권 만료 2007년)
        {
            title: '동백꽃',
            author: '김유정',
            year: 1936,
            paragraphs: [
                '오늘도 또 우리 수탉이 막 쫓기었다.',
                '내가 점심을 먹고 나무를 하러 갈 양으로 나올 때이었다.',
                '산으로 올라서려는데 등 뒤에서 푸드득 푸드득 하고 닭의 횃소리가 야단이다.',
                '깜짝 놀라 고개를 돌려보니 아니나 다를까 두 놈이 또 얼리었다.',
                '점순네 수탉이 쌔게 내리더라.',
            ]
        },
        {
            title: '봄봄',
            author: '김유정',
            year: 1935,
            paragraphs: [
                '나는 점순이가 좋았지만 점순이는 나를 싫어하는 것 같았다.',
                '그도 그럴 것이 나는 점순이에게 아무런 재미도 주지 못했으니까.',
                '작년 봄부터 데릴사위로 들어와서 삼 년째 품을 팔고 있건마는 혼인날은 자꾸 물러만 가고 나이만 자꾸 먹어 가고.',
                '봉필이 영감은 점순이가 아직 어려서 그런다고 하지마는 나는 그게 핑계인 줄을 안다.',
                '점순이가 열일곱인데 나이가 어려서 뭘 어째.',
            ]
        },
        // 나도향 - 벙어리 삼룡이 (1902-1926, 저작권 만료 1996년)
        {
            title: '벙어리 삼룡이',
            author: '나도향',
            year: 1925,
            paragraphs: [
                '삼룡이는 벙어리였다.',
                '말 한마디 못 하고 귀도 어두운 삼룡이는 그래도 천상 일꾼이었다.',
                '그는 부잣집에서 종노릇을 했다.',
                '아침에 일어나면 마당을 쓸고 소를 먹이고 나무를 하고 물을 긷고.',
                '삼룡이는 부지런했다.',
            ]
        },
    ];

    for (const novel of novels) {
        for (let i = 0; i < novel.paragraphs.length; i++) {
            const displayRef = `${novel.title} ${i + 1}문단`;
            await dataSource.query(
                `INSERT INTO content (content_type, work_title, author, chapter, section, content, display_reference, publication_year)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [ContentType.NOVEL, novel.title, novel.author, 1, i + 1, novel.paragraphs[i], displayRef, novel.year]
            );
            totalItems++;
        }
        console.log(`  ✓ ${novel.author} - ${novel.title}`);
    }

    console.log(`\n✅ Total: ${totalItems} items imported`);

    await dataSource.destroy();
    console.log('Done!');
}

seedContent().catch(console.error);
