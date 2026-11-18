const axios = require("axios");

const getLanguageById = (lang) => {
  const language = {
    "c++": 54,
    java: 62,
    javascript: 63,
  };
  return language[lang.toLowerCase()];
};

const toBase64 = (val) => {
  if (val === undefined || val === null) return undefined;
  return Buffer.from(String(val), "utf8").toString("base64");
};

const fromBase64 = (val) => {
  if (val === undefined || val === null) return val;
  if (typeof val !== "string") return val;
  try {
    return Buffer.from(val, "base64").toString("utf8");
  } catch {
    return val;
  }
};

const decodeSubmissionResult = (sub) => {
  if (!sub || typeof sub !== "object") return sub;
  return {
    ...sub,
    stdout: fromBase64(sub.stdout),
    stderr: fromBase64(sub.stderr),
    compile_output: fromBase64(sub.compile_output),
    message: fromBase64(sub.message),
    stdin: fromBase64(sub.stdin),
    expected_output: fromBase64(sub.expected_output),
  };
};

const submitBatch = async (submissions) => {
  const encodedSubmissions = submissions.map((s) => ({
    ...s,
    source_code: toBase64(s.source_code),
    stdin: toBase64(s.stdin),
    expected_output: toBase64(s.expected_output),
  }));

  const options = {
    method: "POST",
    url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
    params: {
      base64_encoded: "true",
    },
    headers: {
      "x-rapidapi-key": process.env.JUDGE0_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    timeout: 15_000,
    data: {
      submissions: encodedSubmissions,
    },
  };

  const response = await axios.request(options);
  return response.data;
};

const waiting = (timer) => new Promise((resolve) => setTimeout(resolve, timer));

const JUDGE0_TIMEOUT_MS = 60_000;

const submitToken = async (resultToken) => {
  const options = {
    method: "GET",
    url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
    params: {
      tokens: resultToken.join(","),
      base64_encoded: "true",
      fields: "*",
    },
    headers: {
      "x-rapidapi-key": process.env.JUDGE0_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    },
    timeout: 15_000,
  };

  const fetchData = async () => {
    const response = await axios.request(options);
    return response.data;
  };

  const deadline = Date.now() + JUDGE0_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const result = await fetchData();

    if (!result || !Array.isArray(result.submissions)) {
      throw new Error("Judge0 returned an invalid response");
    }

    const isResultObtained = result.submissions.every((r) => r.status_id > 2);
    if (isResultObtained) {
      return result.submissions.map(decodeSubmissionResult);
    }

    await waiting(1000);
  }

  throw new Error("Judge0 timed out waiting for submission results");
};

module.exports = { getLanguageById, submitBatch, submitToken };
