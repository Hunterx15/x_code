const mongoose = require("mongoose");
const Problem = require("../models/problem");
const User = require("../models/user");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const SAMPLE_PROBLEMS = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "easy",
    tags: "array",
    visibleTestCases: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    hiddenTestCases: [
      { input: "nums = [3,3], target = 6", output: "[0,1]" }
    ],
    startCode: [
      { language: "JavaScript", initialCode: "function twoSum(nums, target) {\n  // Write your code here\n}" },
      { language: "C++", initialCode: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};" },
      { language: "Java", initialCode: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}" }
    ],
    referenceSolution: [
      { language: "JavaScript", completeCode: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}" },
      { language: "C++", completeCode: "#include <vector>\n#include <unordered_map>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> m;\n        for (int i = 0; i < nums.size(); i++) {\n            int comp = target - nums[i];\n            if (m.count(comp)) return {m[comp], i};\n            m[nums[i]] = i;\n        }\n        return {};\n    }\n};" },
      { language: "Java", completeCode: "import java.util.HashMap;\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        HashMap<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (map.containsKey(comp)) return new int[]{map.get(comp), i};\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}" }
    ]
  },
  {
    title: "Valid Parentheses",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    difficulty: "easy",
    tags: "string",
    visibleTestCases: [
      { input: "s = '()'", output: "true", explanation: "Matching parentheses." },
      { input: "s = '()[]{}'", output: "true", explanation: "All brackets close properly." },
      { input: "s = '(]'", output: "false", explanation: "Mismatched closing bracket." }
    ],
    hiddenTestCases: [
      { input: "s = '([)]'", output: "false" }
    ],
    startCode: [
      { language: "JavaScript", initialCode: "function isValid(s) {\n  // Write your code here\n}" },
      { language: "C++", initialCode: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write code here\n    }\n};" },
      { language: "Java", initialCode: "class Solution {\n    public boolean isValid(String s) {\n        // Write code here\n        return false;\n    }\n}" }
    ],
    referenceSolution: [
      { language: "JavaScript", completeCode: "function isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (const c of s) {\n    if (c in map) {\n      if (stack.pop() !== map[c]) return false;\n    } else stack.push(c);\n  }\n  return stack.length === 0;\n}" },
      { language: "C++", completeCode: "#include <string>\n#include <stack>\nusing namespace std;\nclass Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == '(' || c == '{' || c == '[') st.push(c);\n            else {\n                if (st.empty()) return false;\n                if (c == ')' && st.top() != '(') return false;\n                if (c == '}' && st.top() != '{') return false;\n                if (c == ']' && st.top() != '[') return false;\n                st.pop();\n            }\n        }\n        return st.empty();\n    }\n};" },
      { language: "Java", completeCode: "import java.util.Stack;\nclass Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(') stack.push(')');\n            else if (c == '{') stack.push('}');\n            else if (c == '[') stack.push(']');\n            else if (stack.isEmpty() || stack.pop() != c) return false;\n        }\n        return stack.isEmpty();\n    }\n}" }
    ]
  },
  {
    title: "Best Time to Buy and Sell Stock",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
    difficulty: "easy",
    tags: "array",
    visibleTestCases: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "In this case, no transactions are done and the max profit = 0." }
    ],
    hiddenTestCases: [
      { input: "prices = [2,4,1]", output: "2" }
    ],
    startCode: [
      { language: "JavaScript", initialCode: "function maxProfit(prices) {\n  // Write your code here\n}" },
      { language: "C++", initialCode: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write code here\n    }\n};" },
      { language: "Java", initialCode: "class Solution {\n    public int maxProfit(int[] prices) {\n        // Write code here\n        return 0;\n    }\n}" }
    ],
    referenceSolution: [
      { language: "JavaScript", completeCode: "function maxProfit(prices) {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    else if (price - minPrice > maxProfit) maxProfit = price - minPrice;\n  }\n  return maxProfit;\n}" },
      { language: "C++", completeCode: "#include <vector>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        int minP = 1e9, maxP = 0;\n        for (int p : prices) {\n            minP = min(minP, p);\n            maxP = max(maxP, p - minP);\n        }\n        return maxP;\n    }\n};" },
      { language: "Java", completeCode: "class Solution {\n    public int maxProfit(int[] prices) {\n        int minPrice = Integer.MAX_VALUE, maxProfit = 0;\n        for (int p : prices) {\n            if (p < minPrice) minPrice = p;\n            else if (p - minPrice > maxProfit) maxProfit = p - minPrice;\n        }\n        return maxProfit;\n    }\n}" }
    ]
  },
  {
    title: "Longest Substring Without Repeating Characters",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    difficulty: "medium",
    tags: "string",
    visibleTestCases: [
      { input: "s = 'abcabcbb'", output: "3", explanation: "The answer is 'abc', with the length of 3." },
      { input: "s = 'bbbbb'", output: "1", explanation: "The answer is 'b', with the length of 1." },
      { input: "s = 'pwwkew'", output: "3", explanation: "The answer is 'wke', with the length of 3." }
    ],
    hiddenTestCases: [
      { input: "s = ' '", output: "1" }
    ],
    startCode: [
      { language: "JavaScript", initialCode: "function lengthOfLongestSubstring(s) {\n  // Write your code here\n}" },
      { language: "C++", initialCode: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write code here\n    }\n};" },
      { language: "Java", initialCode: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write code here\n        return 0;\n    }\n}" }
    ],
    referenceSolution: [
      { language: "JavaScript", completeCode: "function lengthOfLongestSubstring(s) {\n  let maxLen = 0, left = 0;\n  const set = new Set();\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) {\n      set.delete(s[left]);\n      left++;\n    }\n    set.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}" },
      { language: "C++", completeCode: "#include <string>\n#include <unordered_set>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        unordered_set<char> st;\n        int maxL = 0, l = 0;\n        for (int r = 0; r < s.length(); r++) {\n            while (st.count(s[r])) { st.erase(s[l]); l++; }\n            st.insert(s[r]);\n            maxL = max(maxL, r - l + 1);\n        }\n        return maxL;\n    }\n};" },
      { language: "Java", completeCode: "import java.util.HashSet;\nclass Solution {\n    public int lengthOfLongestSubstring(String s) {\n        HashSet<Character> set = new HashSet<>();\n        int max = 0, left = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (set.contains(s.charAt(right))) {\n                set.remove(s.charAt(left));\n                left++;\n            }\n            set.add(s.charAt(right));\n            max = Math.max(max, right - left + 1);\n        }\n        return max;\n    }\n}" }
    ]
  },
  {
    title: "Binary Search",
    description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    difficulty: "easy",
    tags: "binarySearch",
    visibleTestCases: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1", explanation: "2 does not exist in nums so return -1" }
    ],
    hiddenTestCases: [
      { input: "nums = [5], target = 5", output: "0" }
    ],
    startCode: [
      { language: "JavaScript", initialCode: "function search(nums, target) {\n  // Write your code here\n}" },
      { language: "C++", initialCode: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write code here\n    }\n};" },
      { language: "Java", initialCode: "class Solution {\n    public int search(int[] nums, int target) {\n        // Write code here\n        return -1;\n    }\n}" }
    ],
    referenceSolution: [
      { language: "JavaScript", completeCode: "function search(nums, target) {\n  let l = 0, r = nums.length - 1;\n  while (l <= r) {\n    const mid = Math.floor((l + r) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) l = mid + 1;\n    else r = mid - 1;\n  }\n  return -1;\n}" },
      { language: "C++", completeCode: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        int l = 0, r = nums.size() - 1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        return -1;\n    }\n};" },
      { language: "Java", completeCode: "class Solution {\n    public int search(int[] nums, int target) {\n        int l = 0, r = nums.length - 1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        return -1;\n    }\n}" }
    ]
  },
  {
    title: "Coin Change",
    description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.",
    difficulty: "medium",
    tags: "dp",
    visibleTestCases: [
      { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1" },
      { input: "coins = [2], amount = 3", output: "-1", explanation: "Cannot form 3 using only 2s." },
      { input: "coins = [1], amount = 0", output: "0", explanation: "0 coins needed." }
    ],
    hiddenTestCases: [
      { input: "coins = [1], amount = 2", output: "2" }
    ],
    startCode: [
      { language: "JavaScript", initialCode: "function coinChange(coins, amount) {\n  // Write your code here\n}" },
      { language: "C++", initialCode: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Write code here\n    }\n};" },
      { language: "Java", initialCode: "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Write code here\n        return -1;\n    }\n}" }
    ],
    referenceSolution: [
      { language: "JavaScript", completeCode: "function coinChange(coins, amount) {\n  const dp = new Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  for (let i = 1; i <= amount; i++) {\n    for (const c of coins) {\n      if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i - c] + 1);\n    }\n  }\n  return dp[amount] === Infinity ? -1 : dp[amount];\n}" },
      { language: "C++", completeCode: "#include <vector>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        vector<int> dp(amount + 1, 1e9);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) {\n                if (i - c >= 0) dp[i] = min(dp[i], dp[i - c] + 1);\n            }\n        }\n        return dp[amount] > 1e8 ? -1 : dp[amount];\n    }\n};" },
      { language: "Java", completeCode: "import java.util.Arrays;\nclass Solution {\n    public int coinChange(int[] coins, int amount) {\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) {\n                if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i - c] + 1);\n            }\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n}" }
    ]
  }
];

async function seed() {
  const uri = process.env.DB_CONNECT_STRING;
  if (!uri) {
    console.error("DB_CONNECT_STRING is required in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  // Find an admin or any user to assign as problemCreator
  let creator = await User.findOne({ role: "admin" }) || await User.findOne({});
  if (!creator) {
    creator = await User.create({
      firstName: "Admin",
      lastName: "System",
      emailId: "admin@xcode.dev",
      role: "admin",
      password: "admin_seed_password_hash",
    });
  }

  let seededCount = 0;
  for (const p of SAMPLE_PROBLEMS) {
    const existing = await Problem.findOne({ title: p.title });
    if (!existing) {
      await Problem.create({
        ...p,
        problemCreator: creator._id,
      });
      console.log(`+ Seeded: ${p.title} (${p.difficulty} - ${p.tags})`);
      seededCount++;
    } else {
      console.log(`- Skipping already existing problem: ${p.title}`);
    }
  }

  console.log(`\nDone! Successfully seeded ${seededCount} new problems.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}

module.exports = { SAMPLE_PROBLEMS, seed };
