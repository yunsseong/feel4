import { DataSource } from 'typeorm';

async function makeAdmin(email: string) {
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5632'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'feel4',
    });

    await ds.initialize();
    console.log('✅ Database connected');

    // 유저 찾기
    const user = await ds.query(
        `SELECT id, email, nickname, role FROM users WHERE email = $1`,
        [email]
    );

    if (user.length === 0) {
        console.error('❌ 유저를 찾을 수 없습니다:', email);
        await ds.destroy();
        return;
    }

    console.log('📋 현재 유저 정보:');
    console.log(user[0]);

    // 어드민으로 변경
    await ds.query(
        `UPDATE users SET role = 'admin' WHERE email = $1`,
        [email]
    );

    // 변경 확인
    const updated = await ds.query(
        `SELECT id, email, nickname, role FROM users WHERE email = $1`,
        [email]
    );

    console.log('\n✅ 어드민으로 변경 완료:');
    console.log(updated[0]);

    await ds.destroy();
}

// 사용법: npx ts-node src/scripts/make-admin.ts
const email = process.argv[2] || 'ysjeong15@gmail.com';
makeAdmin(email).catch(console.error);
