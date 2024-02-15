const express = require('express');
const { Client } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// PostgreSQL 연결 정보 설정
const client = new Client({
    user: 'modii',
    password: 'rla920414!!',
    host: 'modii-db.c3qouqw2qse5.ap-northeast-2.rds.amazonaws.com',
    database: 'modii',
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
    }
});

// 데이터베이스 연결
client.connect();

// EJS를 사용하기 위한 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 루트 경로에 대한 라우트 정의
app.get('/', async (req, res) => {
  try {
    // dailylooks_bestdailylook 테이블에서 상위 20개 데이터 가져오기
    const result = await client.query('SELECT * FROM dailylooks_bestdailylook ORDER BY id DESC LIMIT 20');

    // 이미지 URL을 전체 URL로 변환
    const imageUrls = result.rows.map(async row => {
      const imageResult = await client.query(`SELECT image FROM dailylooks_dailylook WHERE id = $1`, [row.dailylook_id]);
      return `https://modii-media2.s3.ap-northeast-2.amazonaws.com/${imageResult.rows[0].image}`;
    });

    // 이미지 URL이 모두 생성되면 EJS 템플릿 렌더링
    Promise.all(imageUrls)
      .then(urls => {
        res.render('index', { imageUrls: urls });
      })
      .catch(error => {
        console.error('Error fetching image data from the database:', error);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error fetching data from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
