#!/usr/bin/env node
// Verify Moltbook test post

const fetch = globalThis.fetch;

const verification_code = 'moltbook_verify_b1751e029b1c9b2fd6414772d80df9f9';
const challenge = "A] Lo.bS tErR um S^wImS| wItH/ a CLaW] FoR Ce- Of^ TwEnTy FiVe NooToNs~ aNd[ GrApPLeS\\ wItH/ aNoThEr WhOsE CLaW] FoR Ce- Is^ FoUrTeEn NooToNs, HoW/ MuCh] ToTaL\\ FoR Ce-?";

// Extract all numeric words: twenty five, fourteen
const challengeLower = challenge.toLowerCase();

// Map word numbers to digits
const wordToNum = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
};

let sum = 0;

// Find "twenty five" → 25
if (challengeLower.includes('twenty five')) {
  sum += 25;
  console.log('Found: twenty five = 25');
}
// Find "fourteen" → 14
if (challengeLower.includes('fourteen')) {
  sum += 14;
  console.log('Found: fourteen = 14');
}

// Also look for any plain digits as fallback
const plainDigits = challenge.match(/\d+/g);
if (plainDigits) {
  const digitSum = plainDigits.reduce((a, b) => a + parseInt(b), 0);
  console.log('Plain digits found:', plainDigits, 'sum =', digitSum);
  sum += digitSum;
}

const answer = sum.toFixed(2);
console.log('Total sum:', sum);
console.log('Answer (2 decimal places):', answer);

// Send verification
const res = await fetch('https://www.moltbook.com/api/v1/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer moltbook_sk_cPOkLTi7NCotzWvMX4b2n6A3vNboGff9',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ verification_code, answer })
});

const data = await res.json();
console.log('Verify response:', JSON.stringify(data, null, 2));

if (data.success) {
  console.log('✅ Post verified and published!');
} else {
  console.error('❌ Verification failed:', data);
  process.exit(1);
}
