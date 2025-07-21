import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

app.post('/process', async (req, res) => {
  const { url } = req.body;
  const id = uuid();
  const inPath = `/tmp/input-${id}.wav`;
  const outPath = `/tmp/output-${id}.wav`;

  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(inPath, buffer);

    ffmpeg(inPath)
      .audioChannels(1)
      .save(outPath)
      .on('end', () => {
        res.download(outPath, () => {
          fs.unlinkSync(inPath);
          fs.unlinkSync(outPath);
        });
      })
      .on('error', (err) => {
        console.error(err);
        res.status(500).send('Processing failed');
      });
  } catch (error) {
    console.error('Failed to process audio:', error);
    res.status(500).send('Internal error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
