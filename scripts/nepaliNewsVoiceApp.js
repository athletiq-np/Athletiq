#!/usr/bin/env node
// scripts/nepaliNewsVoiceApp.js
// Simple Nepali voice-based news announcer (text output with optional speech)

const Parser = require('rss-parser');
const { exec } = require('child_process');

// Google News Nepali RSS feed
const RSS_URL = 'https://news.google.com/rss?hl=ne&gl=NP&ceid=NP:ne';

async function fetchNews() {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL(RSS_URL);
    return feed.items.slice(0, 5).map(item => item.title.replace(/\s+/g, ' ').trim());
  } catch (err) {
    console.error('Failed to fetch news. Check your network connection or proxy settings.');
    return [];
  }
}

async function announceNews() {
  const intro = 'ओहो, आजका समाचार सुन्दा मन नै दुःखी हुन्छ 😢';
  const outro = 'अब फेरि खुशी हुन तयार हुँदै रमाइलो गरौं! 😄';

  console.log(intro);

  const headlines = await fetchNews();
  if (headlines.length === 0) {
    console.log('समाचार लोड गर्न सकिएन।');
  } else {
    headlines.forEach((title, idx) => {
      console.log(`${idx + 1}. ${title}`);
    });
  }

  console.log(outro);

  // Attempt voice output if 'say' is available
  const sayText = [intro, ...headlines, outro].join('. ');
  if (sayText.trim().length > 0) {
    exec(`say -v Nepali "${sayText}"`, (err) => {
      if (err) {
        console.error('Voice output failed. Ensure the "say" command with Nepali voice is installed.');
      }
    });
  }
}

announceNews().catch(err => {
  console.error('Error fetching news:', err.message);
});
