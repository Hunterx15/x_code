const axios = require('axios');


const getLanguageById = (lang)=>{

    const language = {
        "c++":54,
        "java":62,
        "javascript":63
    }


    return language[lang.toLowerCase()]
}


const submitBatch = async (submissions)=>{


const options = {
  method: 'POST',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    base64_encoded: 'false'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
    submissions
  }
};

// Bug #13 fix: re-throw the error instead of swallowing it.
// The old code caught the error, logged it, and returned undefined —
// causing the caller to crash on `result.map(...)` with an opaque TypeError.
const response = await axios.request(options);
return response.data;

}


const waiting = (timer)=>{
  return new Promise((resolve)=> setTimeout(resolve,timer));
}

// Bug #12 fix: add a 60-second deadline so the polling loop can't hang
// forever if Judge0 is degraded or a submission is stuck in "processing".
const JUDGE0_TIMEOUT_MS = 60_000;

const submitToken = async(resultToken)=>{

const options = {
  method: 'GET',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    tokens: resultToken.join(","),
    base64_encoded: 'false',
    fields: '*'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
  }
};

// Bug #13 fix: re-throw errors so callers can handle them.
const fetchData = async () => {
  const response = await axios.request(options);
  return response.data;
};

const deadline = Date.now() + JUDGE0_TIMEOUT_MS;

 while(Date.now() < deadline){

 const result =  await fetchData();

  // Guard against an unexpected response shape.
  if (!result || !Array.isArray(result.submissions)) {
    throw new Error("Judge0 returned an invalid response");
  }

  const IsResultObtained =  result.submissions.every((r)=>r.status_id>2);

  if(IsResultObtained)
    return result.submissions;

  await waiting(1000);
}

 // Bug #12 fix: exit the loop with a clear error instead of hanging forever.
 throw new Error("Judge0 timed out waiting for submission results");

}


module.exports = {getLanguageById,submitBatch,submitToken};
