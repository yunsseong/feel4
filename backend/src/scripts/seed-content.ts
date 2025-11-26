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
        database: process.env.DB_NAME || 'feel4',
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

    // ========== SEED ESSAYS ==========
    console.log('\n📜 Seeding Korean essays...');

    const essays = [
        // 강경애 - 꽃송이같은 첫 눈 (1906-1944, 저작권 만료)
        {
            title: '꽃송이같은 첫 눈',
            author: '강경애',
            year: 1932,
            paragraphs: [
                '오늘은 아침부터 해가 안 나는지 마치 촛불을 켜대는 것처럼 발갛게 피어오르던 우리 방 앞문이 종일 컴컴했다. 그리고 이따금식 문풍지가 우룽룽 우룽룽 했다. 잔기침 소리가 나며 마을 갔던 어머니가 들어오신다.',
                '"어머니, 어디 갔댔어?" 바느질하던 손을 멈추고 어머니를 쳐다보았다. 치마폭에 풍겨 들어온 산뜻한 찬 공기며 발개진 코끝.',
                '"에이, 춥다." 어머니는 화로를 마주앉으며 부저로 손끝이 발개지도록 불을 헤치신다. "잔칫집에 갔댔다."',
                '"비 와요?" "비는 왜, 눈이 오는데." "눈? 벌써 눈이 와. 어디." 어린애처럼 뛰어 일어나자 손끝이 따끔해서 굽어보니 바늘이 반짝 빛났다.',
                '나는 손끝을 동이고 밖으로 뛰어나갔다. 하늘은 보이지 않고 눈송이로 뽀하다. 보슬보슬 눈이 내린다. 마치 내 가슴속가지도 눈이 내리는 듯했다.',
                '"너는 언제까지나 바늘과만 싸우려느냐?" 이런 질문이 나도 모르게 내 입속에서 굴러 떨어졌다. 나는 싸늘한 대문에 몸을 기대고 언제까지나 움직이지 않았다. 꽃송이 같은 눈은 떨어진다, 떨어진다.',
            ]
        },
        // 이상 - 권태 (1910-1937, 저작권 만료)
        {
            title: '권태',
            author: '이상',
            year: 1937,
            paragraphs: [
                '어서, 차라리 어두워버리기나 했으면 좋겠는데─벽촌의 여름날은 지리해서 죽겠을 만치 길다. 동에 팔봉산. 곡선은 왜 저리도 굴곡이 없이 단조로운고?',
                '서를 보아도 벌판, 남을 보아도 벌판, 북을 보아도 벌판, 아─이 벌판은 어쩌라고 이렇게 한이 없이 늘어 놓였을꼬? 어쩌자고 저렇게까지 똑같이 초록색 하나로 돼먹었노?',
                '나는 아침을 먹었다. 그러나 무작정 널따란 백지 같은 <오늘>이라는 것이 내 앞에 펼쳐져 있으면서, 무슨 기사라도 좋으니 강요한다. 나는 무엇이고 하지 않으면 안 된다.',
                '최서방은 들에 나갔다. 최서방의 조카와 열 번 두면 열 번 내가 이긴다. 지는 것도 권태여늘 이기는 것이 어찌 권태 아닐 수 있으랴?',
                '나는 개울가로 간다. 가물로 하여 너무 빈약한 물이 소리없이 흐른다. 나는 그 물가에 앉는다. 앉아서, 자──무슨 제목으로 나는 사색해야 할 것인가 생각해 본다.',
                '지구 표면적의 백분의 구십구가 이 공포의 초록색이리라. 그렇다면, 지구야말로 너무나 단조 무미한 채색이다. 도회에는 초록이 드물다.',
                '그들에게 희망이 있던가 가을에 곡식이 익으리라? 그러나 그것은 희망은 아니다. 본능이다.',
            ]
        },
        // 이상 - 산촌여정 (1910-1937, 저작권 만료)
        {
            title: '산촌여정',
            author: '이상',
            year: 1935,
            paragraphs: [
                '향기로운 MJB의 미각을 잊어버린 지도 20여 일이나 됩니다. 이 곳에는 신문도 잘 아니 오고 체전부(遞傳夫)는 이따금 하드롱 빛 소식을 가져옵니다.',
                '건너편 팔봉산에는 노루와 멧돼지가 있답니다. 밤이 되면 달도 없는 그믐 칠야에 팔봉산도 사람이 침소로 들어가듯이 어둠 속으로 아주 없어져 버립니다.',
                '그러나 공기는 수정처럼 맑아서 별빛만으로라도 넉넉히 좋아하는 「누가복음」도 읽을 수 있을 것 같습니다. 그리고 또 참 별이 도회에서보다 갑절이나 더 많이 나옵니다.',
                '객주집 방에는 석유 등잔을 켜 놓습니다. 그 도회지의 석간(夕刊)과 같은 그윽한 내음새가 소년 시대의 꿈을 부릅니다.',
                '죽어 버릴까 그런 생각을 하여 봅니다. 벽 못에 걸린 다 해진 내 저고리를 쳐다봅니다. 서도천리(西道千里)를 나를 따라 여기 와 있습니다그려!',
            ]
        },
        // 이상 - 아름다운 조선말 (1910-1937, 저작권 만료)
        {
            title: '아름다운 조선말',
            author: '이상',
            year: 1936,
            paragraphs: [
                '무관한 친구가 하나 있대서 걸핏하면 성천에를 가구가구 했습니다. 거기서 서도인 말이 얼마나 아름답다는 것을 깨쳤습니다.',
                '들어 있는 여관 아이들이 손을 가리켜 \'나가네\'라고 그러는 소리를 듣고 \'좋은 말이구나\' 했습니다. 나같이 표표한 여객이야말로 \'나가네\'란 말에 딱 필적하는 것같이 회심의 음향이었습니다.',
                '또 \'눈깔사탕\'을 \'댕구알\'이라고들 합니다. \'눈깔사탕\'의 깜찍스럽고 무미한 어감에 비하여 \'댕구알\'이 풍기는 해학적인 여운이 여간 구수하지 않습니다.',
                '그리고 어서 어서 하고 재촉할 제 \'엉야―\' 하고 콧소리를 내어서 좀 길게 끌어 잡아댕기는 풍속이 있으니 그것이 젊은 여인네인 경우에 눈이 스르르 감길 듯이 매력적입니다.',
                '불초 이상은 말끝마다 참 참 소리가 많아 늘 듣는 이들의 웃음을 사는데 제 딴은 참 소리야말로 참 아름다운 화술인 줄 믿고 그러는 것이어늘 웃는 것은 참 이상한 일입니다.',
            ]
        },
        // 나혜석 - 이혼 고백장 발췌 (1896-1948, 저작권 만료)
        {
            title: '이혼 고백장',
            author: '나혜석',
            year: 1934,
            paragraphs: [
                '나이 사십 오십에 갓가왓고 전문교육을 밧앗고 남들의 용이히 할 수 업는 구미 만유를 하엿고 후배를 지도할만한 처지에 잇서서 그 인격을 통일치 못하고 그 생활을 통일치 못한 거슨 두 사람 자신은 물론 붓그러워 할 아니라 일반 사회에 대하여서도 면목이 업스며 붓그럽고 사죄하는 바외다.',
                '청구씨! 난생 처음으로 당하는 이 충격은 넘오 상처가 심하고 치명적입니다. 비탄, 동곡, 초조, 번민 ― 이래 이 일체의 궤로에서 생의 방황을 하면서 일편으로 심연의 밋바닥에 던진 씨를 나는 다시 청구씨 ― 하고 부름니다.',
                '청구씨! 하고 부르는 내 눈에는 눈물이 긋득 차집니다. 이거슬 세상은 나를 「약자야」하고 불를가요?',
                '「선량한 남편」 적어도 당신과 나 사이에 과거 생활 궤로에 나타나는 자세가 아니오닛가 「선량한 남편」 사건 이래 얼마나 부정하려 하엿스나 결국 그러한 자세가 지금 상처를 밧은 내 가슴속에 소생하는 청구씨입니다.',
                '미증유의 불상사 세상에 모든 신용을 일코 모든 공분비난을 밧으며 부모친척의 버림을 밧고 옛 조흔 친구를 일흔 나는 물론 불행하려니와 이거슬 단행한 씨에게도 비탄, 절망이 불소할 거십니다.',
                '오직 나는 황야에 헤메고 암야에 공막을 바라고 자실하여 할 입니다.',
            ]
        },
        // 나혜석 - 어머니와 딸 발췌 (1896-1948, 저작권 만료)
        {
            title: '어머니와 딸',
            author: '나혜석',
            year: 1937,
            paragraphs: [
                '「나는 그 잘낮다는 녀자들 부럽지 않아」 틈만나면 한운의 방에 와서 「히々 허々」하는 주인마누라는 오날 저녁에도 또 한운과 리긔봉과 마조 안저 아랫방에 잇는 김선생 귀에 들니라고 일부러 목소리를 크게 하여 말했다.',
                '「녀자란걷은 침선방적을 하야 살림을 잘하고 남편의 밥을 먹어야 하는 거시야」 오날은 갑을병과 마조안고 내일은 이로하와 마조안게되고 때로는 ABC와도 말하게 되는 이 여관집 마누라는 여러번 좌석에서 신여자 논란이 나는 것을 만히 주서 드렀다.',
                '「왜요 신녀성은 침선방적을 못하나요 남편의 밥보다 자긔 밥을 먹으면 더 맞있지」 일년 전에 리혼을 하고 다시 신녀성에게 호긔심을 두고 잇는 리긔봉은 이렇게 반항하였다.',
                '「선생님 저는 공부를 더 하고 싶어요」 「돈 있어」 「고학이라도 해서」 「그렇게 맘대로 되나」 「아이구 죽었스면」 「죽는 것은 남하고 의논하는 것이 아니야」',
                '「공부를 하면 무엇을 전문하겠어?」 「문학이야요」 「문학?」 「좋치」 「어렵지요」 「어렵기야 어렵지만 잘만 하면 좋지 영애는 독서를 많이 해서 문학을 하면 좋을터이야」',
            ]
        },
    ];

    for (const essay of essays) {
        for (let i = 0; i < essay.paragraphs.length; i++) {
            const displayRef = `${essay.title} ${i + 1}문단`;
            await dataSource.query(
                `INSERT INTO content (content_type, work_title, author, chapter, section, content, display_reference, publication_year)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [ContentType.ESSAY, essay.title, essay.author, 1, i + 1, essay.paragraphs[i], displayRef, essay.year]
            );
            totalItems++;
        }
        console.log(`  ✓ ${essay.author} - ${essay.title}`);
    }

    console.log(`\n✅ Total: ${totalItems} items imported`);

    await dataSource.destroy();
    console.log('Done!');
}

seedContent().catch(console.error);
