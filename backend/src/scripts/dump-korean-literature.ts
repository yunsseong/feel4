import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function dumpKoreanLiterature() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5632'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'feel4',
    });

    await dataSource.initialize();
    console.log('✅ Database connected');

    // Query all Korean literature content (not Bible)
    const results = await dataSource.query(`
        SELECT
            content_type,
            work_title,
            author,
            chapter,
            section,
            content,
            display_reference,
            publication_year,
            is_public_domain
        FROM content
        WHERE content_type IN ('novel', 'poem', 'essay')
        ORDER BY content_type, work_title, chapter, section
    `);

    console.log(`📚 Found ${results.length} records`);

    // Generate SQL INSERT statements
    const sqlStatements: string[] = [];

    sqlStatements.push('-- Korean Literature Data Dump');
    sqlStatements.push('-- Generated: ' + new Date().toISOString());
    sqlStatements.push('-- Total records: ' + results.length);
    sqlStatements.push('');
    sqlStatements.push('-- Delete existing Korean literature data');
    sqlStatements.push("DELETE FROM content WHERE content_type IN ('novel', 'poem', 'essay');");
    sqlStatements.push('');
    sqlStatements.push('-- Insert Korean literature data');
    sqlStatements.push('');

    for (const row of results) {
        const escapedContent = row.content.replace(/'/g, "''");
        const escapedTitle = row.work_title.replace(/'/g, "''");
        const escapedAuthor = row.author ? row.author.replace(/'/g, "''") : null;
        const escapedDisplayRef = row.display_reference ? row.display_reference.replace(/'/g, "''") : null;

        const sql = `INSERT INTO content (content_type, work_title, author, chapter, section, content, display_reference, publication_year, is_public_domain) VALUES ('${row.content_type}', '${escapedTitle}', ${escapedAuthor ? `'${escapedAuthor}'` : 'NULL'}, ${row.chapter}, ${row.section}, '${escapedContent}', ${escapedDisplayRef ? `'${escapedDisplayRef}'` : 'NULL'}, ${row.publication_year || 'NULL'}, ${row.is_public_domain});`;

        sqlStatements.push(sql);
    }

    // Write to SQL file
    const outputPath = path.join(__dirname, '../../../claudedocs/korean-literature-data.sql');
    fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf-8');

    console.log(`✅ SQL dump saved to: ${outputPath}`);
    console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

    await dataSource.destroy();
    console.log('✅ Done!');
}

dumpKoreanLiterature().catch(console.error);
