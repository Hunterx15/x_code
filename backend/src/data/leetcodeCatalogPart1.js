// ---------------------------------------------------------------------------
// Curated LeetCode Problem Catalog — Part 1 (Problems 1–30)
// All problems use clean stdin -> stdout I/O compatible with Judge0 CE
// across JavaScript (Node), C++ (GCC), and Java (OpenJDK).
// ---------------------------------------------------------------------------

const makeCodes = ({ jsStart, jsSol, cppStart, cppSol, javaStart, javaSol }) => ({
  startCode: [
    { language: "JavaScript", initialCode: jsStart },
    { language: "C++", initialCode: cppStart },
    { language: "Java", initialCode: javaStart },
  ],
  referenceSolution: [
    { language: "JavaScript", completeCode: jsSol },
    { language: "C++", completeCode: cppSol },
    { language: "Java", completeCode: javaSol },
  ],
});

const JS_STD_START = (fn) =>
  `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n\nfunction solve(input) {\n  // ${fn}\n}\n\nconsole.log(solve(input));`;

const CPP_STD_START = (comment) =>
  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // ${comment}\n    return 0;\n}`;

const JAVA_STD_START = (comment) =>
  `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // ${comment}\n    }\n}`;

const PART_1 = [
  // 1. Two Sum (Easy, array)
  {
    title: "Two Sum",
    difficulty: "easy",
    tags: "array",
    description:
      "Given an array of integers `nums` and an integer `target`, return the two 0-based indices whose values sum to `target` (separated by a space).\n\n**Input Format:**\n- Line 1: `n` (array length)\n- Line 2: `n` space-separated integers\n- Line 3: `target`\n\n**Output Format:**\n- Two space-separated indices `i j` (`i < j`).",
    visibleTestCases: [
      { input: "4\n2 7 11 15\n9", output: "0 1", explanation: "nums[0] + nums[1] = 2 + 7 = 9." },
      { input: "3\n3 2 4\n6", output: "1 2", explanation: "nums[1] + nums[2] = 2 + 4 = 6." },
    ],
    hiddenTestCases: [
      { input: "2\n3 3\n6", output: "0 1" },
      { input: "5\n-1 -2 -3 -4 -5\n-8", output: "2 4" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Read n, nums[], target and print 'i j'"),
      jsSol: `const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = lines[0], nums = lines.slice(1, 1 + n), target = lines[1 + n];\nconst map = new Map();\nfor (let i = 0; i < n; i++) {\n  const need = target - nums[i];\n  if (map.has(need)) { console.log(map.get(need) + ' ' + i); break; }\n  map.set(nums[i], i);\n}`,
      cppStart: CPP_STD_START("Read n, nums, target and print i j"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int i=0;i<n;i++)cin>>a[i];int t;cin>>t;unordered_map<int,int>m;for(int i=0;i<n;i++){if(m.count(t-a[i])){cout<<m[t-a[i]]<<" "<<i;return 0;}m[a[i]]=i;}}`,
      javaStart: JAVA_STD_START("Read n, nums, target and print i j"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();int t=sc.nextInt();Map<Integer,Integer>m=new HashMap<>();for(int i=0;i<n;i++){if(m.containsKey(t-a[i])){System.out.print(m.get(t-a[i])+" "+i);return;}m.put(a[i],i);}}}`,
    }),
  },

  // 2. Best Time to Buy and Sell Stock (Easy, array)
  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "easy",
    tags: "array",
    description:
      "Given daily stock `prices`, choose one day to buy and a later day to sell to maximize profit. Print `0` if no profit is possible.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` space-separated prices\n\n**Output Format:**\n- Maximum profit integer.",
    visibleTestCases: [
      { input: "6\n7 1 5 3 6 4", output: "5", explanation: "Buy at 1, sell at 6 -> profit 5." },
      { input: "5\n7 6 4 3 1", output: "0", explanation: "Prices only decrease, profit is 0." },
    ],
    hiddenTestCases: [
      { input: "3\n2 4 1", output: "2" },
      { input: "1\n5", output: "0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Compute max single-transaction profit"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet mn = Infinity, best = 0;\nfor (let i = 1; i <= d[0]; i++) { mn = Math.min(mn, d[i]); best = Math.max(best, d[i] - mn); }\nconsole.log(best);`,
      cppStart: CPP_STD_START("Compute max profit"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;int mn=INT_MAX,best=0;for(int i=0;i<n;i++){int x;cin>>x;mn=min(mn,x);best=max(best,x-mn);}cout<<best;}`,
      javaStart: JAVA_STD_START("Compute max profit"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),mn=Integer.MAX_VALUE,best=0;for(int i=0;i<n;i++){int x=sc.nextInt();mn=Math.min(mn,x);best=Math.max(best,x-mn);}System.out.print(best);}}`,
    }),
  },

  // 3. Contains Duplicate (Easy, map)
  {
    title: "Contains Duplicate",
    difficulty: "easy",
    tags: "map",
    description:
      "Given an integer array `nums`, print `true` if any value appears at least twice, otherwise print `false`.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "4\n1 2 3 1", output: "true", explanation: "1 appears twice." },
      { input: "4\n1 2 3 4", output: "false", explanation: "All elements are distinct." },
    ],
    hiddenTestCases: [
      { input: "10\n1 1 1 3 3 4 3 2 4 2", output: "true" },
      { input: "1\n42", output: "false" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Check if any duplicate exists"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst nums = d.slice(1, 1 + d[0]);\nconsole.log(new Set(nums).size !== nums.length ? 'true' : 'false');`,
      cppStart: CPP_STD_START("Print true if duplicate exists else false"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;unordered_set<int>s;for(int i=0;i<n;i++){int x;cin>>x;if(!s.insert(x).second){cout<<"true";return 0;}}cout<<"false";}`,
      javaStart: JAVA_STD_START("Print true if duplicate exists else false"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();Set<Integer>s=new HashSet<>();for(int i=0;i<n;i++){if(!s.add(sc.nextInt())){System.out.print("true");return;}}System.out.print("false");}}`,
    }),
  },

  // 4. Valid Anagram (Easy, string)
  {
    title: "Valid Anagram",
    difficulty: "easy",
    tags: "string",
    description:
      "Given two lowercase strings `s` and `t`, print `true` if `t` is an anagram of `s`, and `false` otherwise.\n\n**Input Format:**\n- Line 1: `s`\n- Line 2: `t`",
    visibleTestCases: [
      { input: "anagram\nnagaram", output: "true", explanation: "Both contain identical character counts." },
      { input: "rat\ncar", output: "false", explanation: "Characters differ." },
    ],
    hiddenTestCases: [
      { input: "listen\nsilent", output: "true" },
      { input: "a\nab", output: "false" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Check if s and t are anagrams"),
      jsSol: `const fs = require('fs');\nconst [s, t] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconsole.log(s.split('').sort().join('') === t.split('').sort().join('') ? 'true' : 'false');`,
      cppStart: CPP_STD_START("Check anagram"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s,t;cin>>s>>t;sort(s.begin(),s.end());sort(t.begin(),t.end());cout<<(s==t?"true":"false");}`,
      javaStart: JAVA_STD_START("Check anagram"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);char[]a=sc.next().toCharArray(),b=sc.next().toCharArray();Arrays.sort(a);Arrays.sort(b);System.out.print(Arrays.equals(a,b)?"true":"false");}}`,
    }),
  },

  // 5. Valid Parentheses (Easy, string)
  {
    title: "Valid Parentheses",
    difficulty: "easy",
    tags: "string",
    description:
      "Given a string `s` containing only `(`, `)`, `{`, `}`, `[` and `]`, determine whether the brackets are validly balanced and properly nested.\n\n**Input Format:**\n- Line 1: string `s`\n\n**Output Format:**\n- `true` or `false`",
    visibleTestCases: [
      { input: "()[]{}", output: "true", explanation: "All brackets match in order." },
      { input: "(]", output: "false", explanation: "Mismatched closing bracket." },
    ],
    hiddenTestCases: [
      { input: "{[()]}", output: "true" },
      { input: "([)]", output: "false" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Validate balanced parentheses"),
      jsSol: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconst st = [], m = { ')': '(', '}': '{', ']': '[' };\nlet ok = true;\nfor (const c of s) {\n  if (m[c]) { if (st.pop() !== m[c]) { ok = false; break; } }\n  else st.push(c);\n}\nconsole.log(ok && st.length === 0 ? 'true' : 'false');`,
      cppStart: CPP_STD_START("Validate parentheses"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s;cin>>s;stack<char>st;for(char c:s){if(c=='(')st.push(')');else if(c=='{')st.push('}');else if(c=='[')st.push(']');else if(st.empty()||st.top()!=c){cout<<"false";return 0;}else st.pop();}cout<<(st.empty()?"true":"false");}`,
      javaStart: JAVA_STD_START("Validate parentheses"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String s=sc.next();Deque<Character>st=new ArrayDeque<>();for(char c:s.toCharArray()){if(c=='(')st.push(')');else if(c=='{')st.push('}');else if(c=='[')st.push(']');else if(st.isEmpty()||st.pop()!=c){System.out.print("false");return;}}System.out.print(st.isEmpty()?"true":"false");}}`,
    }),
  },

  // 6. Binary Search (Easy, binarySearch)
  {
    title: "Binary Search",
    difficulty: "easy",
    tags: "binarySearch",
    description:
      "Given a sorted array `nums` of `n` integers and an integer `target`, return its 0-based index in `O(log n)` time, or `-1` if not found.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` sorted integers\n- Line 3: `target`",
    visibleTestCases: [
      { input: "6\n-1 0 3 5 9 12\n9", output: "4", explanation: "9 is at index 4." },
      { input: "6\n-1 0 3 5 9 12\n2", output: "-1", explanation: "2 is not present." },
    ],
    hiddenTestCases: [
      { input: "1\n5\n5", output: "0" },
      { input: "4\n1 3 5 7\n7", output: "3" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Binary search in O(log n)"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], a = d.slice(1, 1 + n), t = d[1 + n];\nlet l = 0, r = n - 1, ans = -1;\nwhile (l <= r) { const m = (l + r) >> 1; if (a[m] === t) { ans = m; break; } else if (a[m] < t) l = m + 1; else r = m - 1; }\nconsole.log(ans);`,
      cppStart: CPP_STD_START("Binary search"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;int t;cin>>t;int l=0,r=n-1;while(l<=r){int m=l+(r-l)/2;if(a[m]==t){cout<<m;return 0;}if(a[m]<t)l=m+1;else r=m-1;}cout<<-1;}`,
      javaStart: JAVA_STD_START("Binary search"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();int t=sc.nextInt(),l=0,r=n-1;while(l<=r){int m=l+(r-l)/2;if(a[m]==t){System.out.print(m);return;}if(a[m]<t)l=m+1;else r=m-1;}System.out.print(-1);}}`,
    }),
  },

  // 7. Climbing Stairs (Easy, dp)
  {
    title: "Climbing Stairs",
    difficulty: "easy",
    tags: "dp",
    description:
      "You are climbing a staircase of `n` steps. Each time you can climb `1` or `2` steps. Return the number of distinct ways to reach the top.\n\n**Input Format:**\n- Line 1: integer `n` (`1 <= n <= 45`)",
    visibleTestCases: [
      { input: "2", output: "2", explanation: "1+1 or 2." },
      { input: "3", output: "3", explanation: "1+1+1, 1+2, or 2+1." },
    ],
    hiddenTestCases: [
      { input: "5", output: "8" },
      { input: "10", output: "89" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Count distinct ways to climb n stairs"),
      jsSol: `const fs = require('fs');\nconst n = Number(fs.readFileSync(0, 'utf8').trim());\nlet a = 1, b = 1;\nfor (let i = 2; i <= n; i++) [a, b] = [b, a + b];\nconsole.log(b);`,
      cppStart: CPP_STD_START("Climbing stairs DP"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;long long a=1,b=1;for(int i=2;i<=n;i++){long long c=a+b;a=b;b=c;}cout<<b;}`,
      javaStart: JAVA_STD_START("Climbing stairs DP"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long a=1,b=1;for(int i=2;i<=n;i++){long c=a+b;a=b;b=c;}System.out.print(b);}}`,
    }),
  },

  // 8. Maximum Subarray (Easy, dp)
  {
    title: "Maximum Subarray",
    difficulty: "easy",
    tags: "dp",
    description:
      "Given an integer array `nums`, find the contiguous subarray with the largest sum and return its sum (Kadane's Algorithm).\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6", explanation: "Subarray [4,-1,2,1] has sum 6." },
      { input: "5\n5 4 -1 7 8", output: "23", explanation: "Entire array sums to 23." },
    ],
    hiddenTestCases: [
      { input: "1\n-5", output: "-5" },
      { input: "4\n-3 -1 -4 -2", output: "-1" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Kadane's max subarray sum"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet cur = d[1], best = d[1];\nfor (let i = 2; i <= d[0]; i++) { cur = Math.max(d[i], cur + d[i]); best = Math.max(best, cur); }\nconsole.log(best);`,
      cppStart: CPP_STD_START("Kadane's algorithm"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;long long cur,best;cin>>cur;best=cur;for(int i=1;i<n;i++){long long x;cin>>x;cur=max(x,cur+x);best=max(best,cur);}cout<<best;}`,
      javaStart: JAVA_STD_START("Kadane's algorithm"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long cur=sc.nextLong(),best=cur;for(int i=1;i<n;i++){long x=sc.nextLong();cur=Math.max(x,cur+x);best=Math.max(best,cur);}System.out.print(best);}}`,
    }),
  },

  // 9. Move Zeroes (Easy, array)
  {
    title: "Move Zeroes",
    difficulty: "easy",
    tags: "array",
    description:
      "Given an integer array `nums`, move all `0`s to the end while maintaining the relative order of the non-zero elements.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers\n\n**Output Format:**\n- Space-separated transformed array.",
    visibleTestCases: [
      { input: "5\n0 1 0 3 12", output: "1 3 12 0 0", explanation: "Non-zero order preserved, zeroes appended." },
      { input: "1\n0", output: "0", explanation: "Single zero unchanged." },
    ],
    hiddenTestCases: [
      { input: "4\n0 0 1 2", output: "1 2 0 0" },
      { input: "3\n4 5 6", output: "4 5 6" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Move all zeroes to the end in-place"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst a = d.slice(1, 1 + d[0]);\nlet k = 0;\nfor (let i = 0; i < a.length; i++) if (a[i] !== 0) { const t = a[k]; a[k++] = a[i]; a[i] = t; }\nconsole.log(a.join(' '));`,
      cppStart: CPP_STD_START("Move zeroes to end"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;int k=0;for(int i=0;i<n;i++)if(a[i]!=0)swap(a[k++],a[i]);for(int i=0;i<n;i++)cout<<(i?" ":"")<<a[i];}`,
      javaStart: JAVA_STD_START("Move zeroes to end"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();int k=0;for(int i=0;i<n;i++)if(a[i]!=0){int t=a[k];a[k++]=a[i];a[i]=t;}StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(a[i]);}System.out.print(sb);}}`,
    }),
  },

  // 10. Majority Element (Easy, array)
  {
    title: "Majority Element",
    difficulty: "easy",
    tags: "array",
    description:
      "Given an array `nums` of size `n`, return the majority element — the element that appears more than `floor(n / 2)` times (Boyer-Moore Voting Algorithm).\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "3\n3 2 3", output: "3", explanation: "3 appears twice out of 3 elements." },
      { input: "7\n2 2 1 1 1 2 2", output: "2", explanation: "2 appears 4 times." },
    ],
    hiddenTestCases: [
      { input: "1\n9", output: "9" },
      { input: "5\n6 5 5 5 6", output: "5" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Boyer-Moore majority vote"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet cand = 0, cnt = 0;\nfor (let i = 1; i <= d[0]; i++) { if (cnt === 0) cand = d[i]; cnt += d[i] === cand ? 1 : -1; }\nconsole.log(cand);`,
      cppStart: CPP_STD_START("Boyer-Moore voting"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;int c=0,k=0;for(int i=0;i<n;i++){int x;cin>>x;if(k==0)c=x;k+=(x==c?1:-1);}cout<<c;}`,
      javaStart: JAVA_STD_START("Boyer-Moore voting"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),c=0,k=0;for(int i=0;i<n;i++){int x=sc.nextInt();if(k==0)c=x;k+=(x==c?1:-1);}System.out.print(c);}}`,
    }),
  },

  // 11. Single Number (Easy, math)
  {
    title: "Single Number",
    difficulty: "easy",
    tags: "math",
    description:
      "Every element in `nums` appears twice except for one unique element. Find that single one in `O(n)` time and `O(1)` extra space.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "3\n2 2 1", output: "1", explanation: "1 appears only once." },
      { input: "5\n4 1 2 1 2", output: "4", explanation: "4 appears only once." },
    ],
    hiddenTestCases: [
      { input: "1\n7", output: "7" },
      { input: "5\n-1 -1 -2 5 5", output: "-2" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("XOR all elements"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet x = 0;\nfor (let i = 1; i <= d[0]; i++) x ^= d[i];\nconsole.log(x);`,
      cppStart: CPP_STD_START("XOR all elements"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,x=0,v;cin>>n;while(n--){cin>>v;x^=v;}cout<<x;}`,
      javaStart: JAVA_STD_START("XOR all elements"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),x=0;while(n-->0)x^=sc.nextInt();System.out.print(x);}}`,
    }),
  },

  // 12. Palindrome Number (Easy, math)
  {
    title: "Palindrome Number",
    difficulty: "easy",
    tags: "math",
    description:
      "Given an integer `x`, print `true` if `x` reads the same backward as forward, and `false` otherwise.\n\n**Input Format:**\n- Line 1: integer `x`",
    visibleTestCases: [
      { input: "121", output: "true", explanation: "121 reversed is 121." },
      { input: "-121", output: "false", explanation: "Negative sign makes it not a palindrome." },
    ],
    hiddenTestCases: [
      { input: "10", output: "false" },
      { input: "12321", output: "true" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Check if integer x is a palindrome"),
      jsSol: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconsole.log(s === s.split('').reverse().join('') ? 'true' : 'false');`,
      cppStart: CPP_STD_START("Palindrome number check"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s;cin>>s;string r=s;reverse(r.begin(),r.end());cout<<(s==r?"true":"false");}`,
      javaStart: JAVA_STD_START("Palindrome number check"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String s=sc.next();String r=new StringBuilder(s).reverse().toString();System.out.print(s.equals(r)?"true":"false");}}`,
    }),
  },

  // 13. Valid Palindrome (Easy, string)
  {
    title: "Valid Palindrome",
    difficulty: "easy",
    tags: "string",
    description:
      "Given a phrase `s`, after converting all uppercase letters into lowercase and removing all non-alphanumeric characters, print `true` if it is a palindrome, else `false`.\n\n**Input Format:**\n- Line 1: string `s` (may contain spaces and punctuation)",
    visibleTestCases: [
      { input: "A man, a plan, a canal: Panama", output: "true", explanation: "'amanaplanacanalpanama' is a palindrome." },
      { input: "race a car", output: "false", explanation: "'raceacar' is not a palindrome." },
    ],
    hiddenTestCases: [
      { input: "0P", output: "false" },
      { input: "Madam, I'm Adam!", output: "true" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Normalize alphanumeric chars and check palindrome"),
      jsSol: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').toLowerCase().replace(/[^a-z0-9]/g, '');\nconsole.log(s === s.split('').reverse().join('') ? 'true' : 'false');`,
      cppStart: CPP_STD_START("Valid palindrome"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s,t;getline(cin,s);for(char c:s)if(isalnum((unsigned char)c))t+=tolower((unsigned char)c);string r=t;reverse(r.begin(),r.end());cout<<(t==r?"true":"false");}`,
      javaStart: JAVA_STD_START("Valid palindrome"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String s=sc.nextLine().toLowerCase().replaceAll("[^a-z0-9]","");String r=new StringBuilder(s).reverse().toString();System.out.print(s.equals(r)?"true":"false");}}`,
    }),
  },

  // 14. Reverse Linked List (Easy, linkedList)
  {
    title: "Reverse Linked List",
    difficulty: "easy",
    tags: "linkedList",
    description:
      "Given the node values of a singly linked list in order, reverse the linked list and print its values.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` node values\n\n**Output Format:**\n- Reversed node values separated by spaces.",
    visibleTestCases: [
      { input: "5\n1 2 3 4 5", output: "5 4 3 2 1", explanation: "1->2->3->4->5 becomes 5->4->3->2->1." },
      { input: "2\n1 2", output: "2 1", explanation: "1->2 becomes 2->1." },
    ],
    hiddenTestCases: [
      { input: "1\n10", output: "10" },
      { input: "4\n-1 0 5 9", output: "9 5 0 -1" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Reverse the linked list"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(d.slice(1, 1 + d[0]).reverse().join(' '));`,
      cppStart: CPP_STD_START("Reverse linked list"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;reverse(a.begin(),a.end());for(int i=0;i<n;i++)cout<<(i?" ":"")<<a[i];}`,
      javaStart: JAVA_STD_START("Reverse linked list"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();StringBuilder sb=new StringBuilder();for(int i=n-1;i>=0;i--){if(i<n-1)sb.append(' ');sb.append(a[i]);}System.out.print(sb);}}`,
    }),
  },

  // 15. Merge Two Sorted Lists (Easy, linkedList)
  {
    title: "Merge Two Sorted Lists",
    difficulty: "easy",
    tags: "linkedList",
    description:
      "Merge two sorted linked lists into one sorted list and print its values.\n\n**Input Format:**\n- Line 1: `n` (length of list 1), followed by `n` sorted integers on Line 2\n- Line 3: `m` (length of list 2), followed by `m` sorted integers on Line 4",
    visibleTestCases: [
      { input: "3\n1 2 4\n3\n1 3 4", output: "1 1 2 3 4 4", explanation: "Merged in non-decreasing order." },
      { input: "2\n1 5\n2\n2 3", output: "1 2 3 5", explanation: "Interleaved sorted order." },
    ],
    hiddenTestCases: [
      { input: "1\n10\n3\n1 2 3", output: "1 2 3 10" },
      { input: "2\n-5 -1\n2\n-3 0", output: "-5 -3 -1 0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Merge two sorted lists"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], a = d.slice(1, 1 + n), m = d[1 + n], b = d.slice(2 + n, 2 + n + m);\nconst res = []; let i = 0, j = 0;\nwhile (i < n && j < m) res.push(a[i] <= b[j] ? a[i++] : b[j++]);\nwhile (i < n) res.push(a[i++]); while (j < m) res.push(b[j++]);\nconsole.log(res.join(' '));`,
      cppStart: CPP_STD_START("Merge two sorted lists"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,m;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;cin>>m;vector<int>b(m);for(int&x:b)cin>>x;vector<int>r(n+m);merge(a.begin(),a.end(),b.begin(),b.end(),r.begin());for(int i=0;i<n+m;i++)cout<<(i?" ":"")<<r[i];}`,
      javaStart: JAVA_STD_START("Merge two sorted lists"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();int m=sc.nextInt();int[]b=new int[m];for(int i=0;i<m;i++)b[i]=sc.nextInt();int i=0,j=0;StringBuilder sb=new StringBuilder();while(i<n||j<m){if(sb.length()>0)sb.append(' ');if(j==m||(i<n&&a[i]<=b[j]))sb.append(a[i++]);else sb.append(b[j++]);}System.out.print(sb);}}`,
    }),
  },

  // 16. Missing Number (Easy, math)
  {
    title: "Missing Number",
    difficulty: "easy",
    tags: "math",
    description:
      "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "3\n3 0 1", output: "2", explanation: "Range is [0..3], 2 is missing." },
      { input: "9\n9 6 4 2 3 5 7 0 1", output: "8", explanation: "8 is missing." },
    ],
    hiddenTestCases: [
      { input: "2\n0 1", output: "2" },
      { input: "1\n1", output: "0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Find missing number in [0..n]"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0];\nlet sum = (n * (n + 1)) / 2;\nfor (let i = 1; i <= n; i++) sum -= d[i];\nconsole.log(sum);`,
      cppStart: CPP_STD_START("Missing number"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){long long n;cin>>n;long long s=n*(n+1)/2,x;for(int i=0;i<n;i++){cin>>x;s-=x;}cout<<s;}`,
      javaStart: JAVA_STD_START("Missing number"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);long n=sc.nextLong(),s=n*(n+1)/2;for(int i=0;i<n;i++)s-=sc.nextLong();System.out.print(s);}}`,
    }),
  },

  // 17. Intersection of Two Arrays (Easy, map)
  {
    title: "Intersection of Two Arrays",
    difficulty: "easy",
    tags: "map",
    description:
      "Given two integer arrays `nums1` and `nums2`, return their unique intersection sorted in ascending order.\n\n**Input Format:**\n- Line 1: `n`, Line 2: `n` ints\n- Line 3: `m`, Line 4: `m` ints",
    visibleTestCases: [
      { input: "4\n1 2 2 1\n2\n2 2", output: "2", explanation: "Only 2 is common." },
      { input: "3\n4 9 5\n5\n9 4 9 8 4", output: "4 9", explanation: "4 and 9 appear in both." },
    ],
    hiddenTestCases: [
      { input: "3\n1 3 5\n3\n5 3 1", output: "1 3 5" },
      { input: "2\n7 8\n2\n8 9", output: "8" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Print sorted unique intersection"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], a = new Set(d.slice(1, 1 + n)), m = d[1 + n], b = d.slice(2 + n, 2 + n + m);\nconst res = [...new Set(b.filter(x => a.has(x)))].sort((x, y) => x - y);\nconsole.log(res.join(' '));`,
      cppStart: CPP_STD_START("Sorted unique intersection"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,m,x;cin>>n;unordered_set<int>s;while(n--){cin>>x;s.insert(x);}cin>>m;set<int>r;while(m--){cin>>x;if(s.count(x))r.insert(x);}bool f=0;for(int v:r){if(f)cout<<" ";cout<<v;f=1;}}`,
      javaStart: JAVA_STD_START("Sorted unique intersection"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();Set<Integer>s=new HashSet<>();while(n-->0)s.add(sc.nextInt());int m=sc.nextInt();TreeSet<Integer>r=new TreeSet<>();while(m-->0){int x=sc.nextInt();if(s.contains(x))r.add(x);}StringBuilder sb=new StringBuilder();for(int v:r){if(sb.length()>0)sb.append(' ');sb.append(v);}System.out.print(sb);}}`,
    }),
  },

  // 18. First Unique Character in a String (Easy, map)
  {
    title: "First Unique Character in a String",
    difficulty: "easy",
    tags: "map",
    description:
      "Given a string `s`, find the first non-repeating character in it and return its 0-based index. If it does not exist, print `-1`.\n\n**Input Format:**\n- Line 1: lowercase string `s`",
    visibleTestCases: [
      { input: "leetcode", output: "0", explanation: "'l' appears once at index 0." },
      { input: "loveleetcode", output: "2", explanation: "'v' at index 2 is first unique." },
    ],
    hiddenTestCases: [
      { input: "aabb", output: "-1" },
      { input: "z", output: "0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Find index of first unique character"),
      jsSol: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconst freq = new Map();\nfor (const c of s) freq.set(c, (freq.get(c) || 0) + 1);\nlet ans = -1;\nfor (let i = 0; i < s.length; i++) if (freq.get(s[i]) === 1) { ans = i; break; }\nconsole.log(ans);`,
      cppStart: CPP_STD_START("First unique character index"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s;cin>>s;int f[26]={0};for(char c:s)f[c-'a']++;for(int i=0;i<(int)s.size();i++)if(f[s[i]-'a']==1){cout<<i;return 0;}cout<<-1;}`,
      javaStart: JAVA_STD_START("First unique character index"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String s=sc.next();int[]f=new int[26];for(char c:s.toCharArray())f[c-'a']++;for(int i=0;i<s.length();i++)if(f[s.charAt(i)-'a']==1){System.out.print(i);return;}System.out.print(-1);}}`,
    }),
  },

  // 19. Roman to Integer (Easy, string)
  {
    title: "Roman to Integer",
    difficulty: "easy",
    tags: "string",
    description:
      "Given a Roman numeral string `s` (`I, V, X, L, C, D, M`), convert it to an integer.\n\n**Input Format:**\n- Line 1: Roman numeral string `s`",
    visibleTestCases: [
      { input: "III", output: "3", explanation: "I+I+I = 3." },
      { input: "MCMXCIV", output: "1994", explanation: "M=1000, CM=900, XC=90, IV=4." },
    ],
    hiddenTestCases: [
      { input: "LVIII", output: "58" },
      { input: "IX", output: "9" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Convert Roman numeral to integer"),
      jsSol: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconst v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };\nlet res = 0;\nfor (let i = 0; i < s.length; i++) res += (i + 1 < s.length && v[s[i]] < v[s[i + 1]]) ? -v[s[i]] : v[s[i]];\nconsole.log(res);`,
      cppStart: CPP_STD_START("Roman to integer"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s;cin>>s;unordered_map<char,int>v={{'I',1},{'V',5},{'X',10},{'L',50},{'C',100},{'D',500},{'M',1000}};int r=0;for(int i=0;i<(int)s.size();i++)r+=(i+1<(int)s.size()&&v[s[i]]<v[s[i+1]])?-v[s[i]]:v[s[i]];cout<<r;}`,
      javaStart: JAVA_STD_START("Roman to integer"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String s=sc.next();Map<Character,Integer>v=Map.of('I',1,'V',5,'X',10,'L',50,'C',100,'D',500,'M',1000);int r=0;for(int i=0;i<s.length();i++)r+=(i+1<s.length()&&v.get(s.charAt(i))<v.get(s.charAt(i+1)))?-v.get(s.charAt(i)):v.get(s.charAt(i));System.out.print(r);}}`,
    }),
  },

  // 20. Plus One (Easy, array)
  {
    title: "Plus One",
    difficulty: "easy",
    tags: "array",
    description:
      "You are given a large integer represented as an array of digits. Increment the large integer by one and print the resulting digits.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` digits separated by spaces",
    visibleTestCases: [
      { input: "3\n1 2 3", output: "1 2 4", explanation: "123 + 1 = 124." },
      { input: "3\n9 9 9", output: "1 0 0 0", explanation: "999 + 1 = 1000." },
    ],
    hiddenTestCases: [
      { input: "1\n9", output: "1 0" },
      { input: "4\n4 3 2 1", output: "4 3 2 2" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Increment digit array by 1"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst a = d.slice(1, 1 + d[0]);\nlet carry = 1;\nfor (let i = a.length - 1; i >= 0 && carry; i--) { const s = a[i] + carry; a[i] = s % 10; carry = Math.floor(s / 10); }\nif (carry) a.unshift(1);\nconsole.log(a.join(' '));`,
      cppStart: CPP_STD_START("Plus one on digit array"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;int c=1;for(int i=n-1;i>=0&&c;i--){a[i]+=c;c=a[i]/10;a[i]%=10;}if(c)a.insert(a.begin(),1);for(int i=0;i<(int)a.size();i++)cout<<(i?" ":"")<<a[i];}`,
      javaStart: JAVA_STD_START("Plus one on digit array"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();int c=1;for(int i=n-1;i>=0&&c>0;i--){a[i]+=c;c=a[i]/10;a[i]%=10;}StringBuilder sb=new StringBuilder();if(c>0)sb.append("1");for(int v:a){if(sb.length()>0)sb.append(' ');sb.append(v);}System.out.print(sb);}}`,
    }),
  },

  // 21. Sqrt(x) (Easy, binarySearch)
  {
    title: "Sqrt(x)",
    difficulty: "easy",
    tags: "binarySearch",
    description:
      "Given a non-negative integer `x`, compute and print the integer square root of `x` rounded down to the nearest integer (using binary search without built-in sqrt).\n\n**Input Format:**\n- Line 1: integer `x`",
    visibleTestCases: [
      { input: "4", output: "2", explanation: "sqrt(4) = 2." },
      { input: "8", output: "2", explanation: "sqrt(8) = 2.828..., floor is 2." },
    ],
    hiddenTestCases: [
      { input: "0", output: "0" },
      { input: "2147395599", output: "46339" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Integer floor(sqrt(x)) via binary search"),
      jsSol: `const fs = require('fs');\nconst x = Number(fs.readFileSync(0, 'utf8').trim());\nlet l = 0, r = x, ans = 0;\nwhile (l <= r) { const m = Math.floor((l + r) / 2); if (m * m <= x) { ans = m; l = m + 1; } else r = m - 1; }\nconsole.log(ans);`,
      cppStart: CPP_STD_START("Binary search integer sqrt"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){long long x;cin>>x;long long l=0,r=x,ans=0;while(l<=r){long long m=l+(r-l)/2;if(m<=x/(m?m:1)&&m*m<=x){ans=m;l=m+1;}else r=m-1;}cout<<ans;}`,
      javaStart: JAVA_STD_START("Binary search integer sqrt"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);long x=sc.nextLong(),l=0,r=x,ans=0;while(l<=r){long m=l+(r-l)/2;if(m*m<=x){ans=m;l=m+1;}else r=m-1;}System.out.print(ans);}}`,
    }),
  },

  // 22. Fibonacci Number (Easy, dp)
  {
    title: "Fibonacci Number",
    difficulty: "easy",
    tags: "dp",
    description:
      "Given `n`, calculate `F(n)` where `F(0) = 0`, `F(1) = 1`, and `F(n) = F(n - 1) + F(n - 2)`.\n\n**Input Format:**\n- Line 1: integer `n` (`0 <= n <= 50`)",
    visibleTestCases: [
      { input: "4", output: "3", explanation: "F(4) = F(3) + F(2) = 2 + 1 = 3." },
      { input: "10", output: "55", explanation: "10th Fibonacci number is 55." },
    ],
    hiddenTestCases: [
      { input: "0", output: "0" },
      { input: "20", output: "6765" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Compute F(n)"),
      jsSol: `const fs = require('fs');\nconst n = Number(fs.readFileSync(0, 'utf8').trim());\nif (n <= 1) { console.log(n); } else { let a = 0, b = 1; for (let i = 2; i <= n; i++) [a, b] = [b, a + b]; console.log(b); }`,
      cppStart: CPP_STD_START("Fibonacci DP"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;if(n<=1){cout<<n;return 0;}long long a=0,b=1;for(int i=2;i<=n;i++){long long c=a+b;a=b;b=c;}cout<<b;}`,
      javaStart: JAVA_STD_START("Fibonacci DP"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();if(n<=1){System.out.print(n);return;}long a=0,b=1;for(int i=2;i<=n;i++){long c=a+b;a=b;b=c;}System.out.print(b);}}`,
    }),
  },

  // 23. Power of Two (Easy, math)
  {
    title: "Power of Two",
    difficulty: "easy",
    tags: "math",
    description:
      "Given an integer `n`, print `true` if it is a power of two (`n == 2^x`), otherwise print `false`.\n\n**Input Format:**\n- Line 1: integer `n`",
    visibleTestCases: [
      { input: "16", output: "true", explanation: "2^4 = 16." },
      { input: "3", output: "false", explanation: "3 is not a power of 2." },
    ],
    hiddenTestCases: [
      { input: "1", output: "true" },
      { input: "0", output: "false" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Bitwise power of two check"),
      jsSol: `const fs = require('fs');\nconst n = Number(fs.readFileSync(0, 'utf8').trim());\nconsole.log(n > 0 && (n & (n - 1)) === 0 ? 'true' : 'false');`,
      cppStart: CPP_STD_START("Power of two"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){long long n;cin>>n;cout<<(n>0&&(n&(n-1))==0?"true":"false");}`,
      javaStart: JAVA_STD_START("Power of two"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);long n=sc.nextLong();System.out.print(n>0&&(n&(n-1))==0?"true":"false");}}`,
    }),
  },

  // 24. Assign Cookies (Easy, greedy)
  {
    title: "Assign Cookies",
    difficulty: "easy",
    tags: "greedy",
    description:
      "Each child `i` has a greed factor `g[i]` and each cookie `j` has size `s[j]`. A child is content if `s[j] >= g[i]`. Maximize the number of content children.\n\n**Input Format:**\n- Line 1: `n`, Line 2: `n` greed factors\n- Line 3: `m`, Line 4: `m` cookie sizes",
    visibleTestCases: [
      { input: "3\n1 2 3\n2\n1 1", output: "1", explanation: "Only child with greed 1 can be satisfied." },
      { input: "2\n1 2\n3\n1 2 3", output: "2", explanation: "Both children can be satisfied." },
    ],
    hiddenTestCases: [
      { input: "3\n10 9 8\n3\n5 6 7", output: "0" },
      { input: "3\n2 4 6\n3\n6 2 4", output: "3" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Sort both arrays and match greedily"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], g = d.slice(1, 1 + n).sort((a, b) => a - b);\nconst m = d[1 + n], s = d.slice(2 + n, 2 + n + m).sort((a, b) => a - b);\nlet i = 0, j = 0;\nwhile (i < n && j < m) { if (s[j] >= g[i]) i++; j++; }\nconsole.log(i);`,
      cppStart: CPP_STD_START("Greedy cookie assignment"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,m;cin>>n;vector<int>g(n);for(int&x:g)cin>>x;cin>>m;vector<int>s(m);for(int&x:s)cin>>x;sort(g.begin(),g.end());sort(s.begin(),s.end());int i=0,j=0;while(i<n&&j<m){if(s[j]>=g[i])i++;j++;}cout<<i;}`,
      javaStart: JAVA_STD_START("Greedy cookie assignment"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]g=new int[n];for(int i=0;i<n;i++)g[i]=sc.nextInt();int m=sc.nextInt();int[]s=new int[m];for(int i=0;i<m;i++)s[i]=sc.nextInt();Arrays.sort(g);Arrays.sort(s);int i=0,j=0;while(i<n&&j<m){if(s[j]>=g[i])i++;j++;}System.out.print(i);}}`,
    }),
  },

  // 25. Longest Substring Without Repeating Characters (Medium, string)
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    tags: "string",
    description:
      "Given a string `s`, find the length of the longest substring without repeating characters.\n\n**Input Format:**\n- Line 1: string `s`",
    visibleTestCases: [
      { input: "abcabcbb", output: "3", explanation: "'abc' has length 3." },
      { input: "pwwkew", output: "3", explanation: "'wke' has length 3." },
    ],
    hiddenTestCases: [
      { input: "bbbbb", output: "1" },
      { input: "dvdf", output: "3" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Sliding window longest unique substring"),
      jsSol: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconst last = new Map(); let l = 0, best = 0;\nfor (let r = 0; r < s.length; r++) {\n  if (last.has(s[r]) && last.get(s[r]) >= l) l = last.get(s[r]) + 1;\n  last.set(s[r], r);\n  best = Math.max(best, r - l + 1);\n}\nconsole.log(best);`,
      cppStart: CPP_STD_START("Sliding window unique substring"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s;cin>>s;vector<int>p(256,-1);int l=0,best=0;for(int r=0;r<(int)s.size();r++){l=max(l,p[(unsigned char)s[r]]+1);p[(unsigned char)s[r]]=r;best=max(best,r-l+1);}cout<<best;}`,
      javaStart: JAVA_STD_START("Sliding window unique substring"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String s=sc.next();int[]p=new int[256];Arrays.fill(p,-1);int l=0,best=0;for(int r=0;r<s.length();r++){l=Math.max(l,p[s.charAt(r)]+1);p[s.charAt(r)]=r;best=Math.max(best,r-l+1);}System.out.print(best);}}`,
    }),
  },

  // 26. Container With Most Water (Medium, array)
  {
    title: "Container With Most Water",
    difficulty: "medium",
    tags: "array",
    description:
      "Given `n` vertical lines where the `i`th line has height `height[i]`, find two lines that together with the x-axis hold the maximum amount of water.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` heights",
    visibleTestCases: [
      { input: "9\n1 8 6 2 5 4 8 3 7", output: "49", explanation: "Lines at index 1 (8) and 8 (7) hold 7 * 7 = 49." },
      { input: "2\n1 1", output: "1", explanation: "Width 1 * height 1 = 1." },
    ],
    hiddenTestCases: [
      { input: "5\n4 3 2 1 4", output: "16" },
      { input: "3\n1 2 1", output: "2" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Two-pointer maximum water area"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst h = d.slice(1, 1 + d[0]);\nlet l = 0, r = h.length - 1, best = 0;\nwhile (l < r) { best = Math.max(best, Math.min(h[l], h[r]) * (r - l)); if (h[l] < h[r]) l++; else r--; }\nconsole.log(best);`,
      cppStart: CPP_STD_START("Two-pointer max area"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long>h(n);for(auto&x:h)cin>>x;int l=0,r=n-1;long long best=0;while(l<r){best=max(best,min(h[l],h[r])*(r-l));if(h[l]<h[r])l++;else r--;}cout<<best;}`,
      javaStart: JAVA_STD_START("Two-pointer max area"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long[]h=new long[n];for(int i=0;i<n;i++)h[i]=sc.nextLong();int l=0,r=n-1;long best=0;while(l<r){best=Math.max(best,Math.min(h[l],h[r])*(r-l));if(h[l]<h[r])l++;else r--;}System.out.print(best);}}`,
    }),
  },

  // 27. 3Sum Count (Medium, array)
  {
    title: "3Sum Unique Triplets",
    difficulty: "medium",
    tags: "array",
    description:
      "Given an integer array `nums`, count the number of unique triplets `[nums[i], nums[j], nums[k]]` (`i != j != k`) such that `nums[i] + nums[j] + nums[k] == 0`.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers\n\n**Output Format:**\n- Count of distinct zero-sum triplets.",
    visibleTestCases: [
      { input: "6\n-1 0 1 2 -1 -4", output: "2", explanation: "[-1,-1,2] and [-1,0,1]." },
      { input: "3\n0 1 1", output: "0", explanation: "No triplet sums to 0." },
    ],
    hiddenTestCases: [
      { input: "3\n0 0 0", output: "1" },
      { input: "5\n-2 0 1 1 2", output: "2" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Sort and two-pointer 3Sum unique count"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst a = d.slice(1, 1 + d[0]).sort((x, y) => x - y);\nlet cnt = 0;\nfor (let i = 0; i < a.length - 2; i++) {\n  if (i > 0 && a[i] === a[i - 1]) continue;\n  let l = i + 1, r = a.length - 1;\n  while (l < r) {\n    const s = a[i] + a[l] + a[r];\n    if (s === 0) { cnt++; while (l < r && a[l] === a[l + 1]) l++; while (l < r && a[r] === a[r - 1]) r--; l++; r--; }\n    else if (s < 0) l++; else r--;\n  }\n}\nconsole.log(cnt);`,
      cppStart: CPP_STD_START("3Sum unique count"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;sort(a.begin(),a.end());int c=0;for(int i=0;i<n-2;i++){if(i&&a[i]==a[i-1])continue;int l=i+1,r=n-1;while(l<r){long long s=(long long)a[i]+a[l]+a[r];if(s==0){c++;while(l<r&&a[l]==a[l+1])l++;while(l<r&&a[r]==a[r-1])r--;l++;r--;}else if(s<0)l++;else r--;}}cout<<c;}`,
      javaStart: JAVA_STD_START("3Sum unique count"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();Arrays.sort(a);int c=0;for(int i=0;i<n-2;i++){if(i>0&&a[i]==a[i-1])continue;int l=i+1,r=n-1;while(l<r){long s=(long)a[i]+a[l]+a[r];if(s==0){c++;while(l<r&&a[l]==a[l+1])l++;while(l<r&&a[r]==a[r-1])r--;l++;r--;}else if(s<0)l++;else r--;}}System.out.print(c);}}`,
    }),
  },

  // 28. Product of Array Except Self (Medium, array)
  {
    title: "Product of Array Except Self",
    difficulty: "medium",
    tags: "array",
    description:
      "Given an integer array `nums`, print an array `answer` such that `answer[i]` equals the product of all elements of `nums` except `nums[i]`, in `O(n)` time without division.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "4\n1 2 3 4", output: "24 12 8 6", explanation: "Prefix * suffix products." },
      { input: "5\n-1 1 0 -3 3", output: "0 0 9 0 0", explanation: "Zero element handled without division." },
    ],
    hiddenTestCases: [
      { input: "2\n5 6", output: "6 5" },
      { input: "3\n0 0 5", output: "0 0 0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Prefix and suffix product without division"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], a = d.slice(1, 1 + n), res = new Array(n).fill(1);\nlet p = 1; for (let i = 0; i < n; i++) { res[i] = p; p *= a[i]; }\nlet s = 1; for (let i = n - 1; i >= 0; i--) { res[i] *= s; s *= a[i]; }\nconsole.log(res.map(x => (Object.is(x, -0) ? 0 : x)).join(' '));`,
      cppStart: CPP_STD_START("Product except self"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long>a(n),r(n,1);for(auto&x:a)cin>>x;long long p=1;for(int i=0;i<n;i++){r[i]=p;p*=a[i];}long long s=1;for(int i=n-1;i>=0;i--){r[i]*=s;s*=a[i];}for(int i=0;i<n;i++)cout<<(i?" ":"")<<r[i];}`,
      javaStart: JAVA_STD_START("Product except self"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long[]a=new long[n],r=new long[n];for(int i=0;i<n;i++)a[i]=sc.nextLong();long p=1;for(int i=0;i<n;i++){r[i]=p;p*=a[i];}long s=1;for(int i=n-1;i>=0;i--){r[i]*=s;s*=a[i];}StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(r[i]);}System.out.print(sb);}}`,
    }),
  },

  // 29. Group Anagrams Count (Medium, map)
  {
    title: "Group Anagrams",
    difficulty: "medium",
    tags: "map",
    description:
      "Given `n` lowercase strings, group anagrams together and print the number of distinct anagram groups.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` space-separated strings",
    visibleTestCases: [
      { input: "6\neat tea tan ate nat bat", output: "3", explanation: "[eat,tea,ate], [tan,nat], [bat] -> 3 groups." },
      { input: "3\nabc bca cab", output: "1", explanation: "All 3 are anagrams of each other." },
    ],
    hiddenTestCases: [
      { input: "1\na", output: "1" },
      { input: "4\na b c d", output: "4" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Count distinct anagram groups"),
      jsSol: `const fs = require('fs');\nconst parts = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst n = Number(parts[0]), set = new Set();\nfor (let i = 1; i <= n; i++) set.add(parts[i].split('').sort().join(''));\nconsole.log(set.size);`,
      cppStart: CPP_STD_START("Group anagrams count"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;unordered_set<string>st;while(n--){string s;cin>>s;sort(s.begin(),s.end());st.insert(s);}cout<<st.size();}`,
      javaStart: JAVA_STD_START("Group anagrams count"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();Set<String>st=new HashSet<>();while(n-->0){char[]c=sc.next().toCharArray();Arrays.sort(c);st.add(new String(c));}System.out.print(st.size());}}`,
    }),
  },

  // 30. Top K Frequent Elements (Medium, map)
  {
    title: "Top K Frequent Elements",
    difficulty: "medium",
    tags: "map",
    description:
      "Given an integer array `nums` and an integer `k`, print the `k` most frequent elements sorted in descending order of frequency (tie-break by smaller value).\n\n**Input Format:**\n- Line 1: `n k`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "6 2\n1 1 1 2 2 3", output: "1 2", explanation: "1 appears 3 times, 2 appears 2 times." },
      { input: "1 1\n1", output: "1", explanation: "Single element." },
    ],
    hiddenTestCases: [
      { input: "7 2\n4 4 1 1 1 2 2", output: "1 2" },
      { input: "5 1\n9 9 9 3 3", output: "9" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Return top k frequent elements"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1], freq = new Map();\nfor (let i = 2; i < 2 + n; i++) freq.set(d[i], (freq.get(d[i]) || 0) + 1);\nconst top = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, k).map(e => e[0]);\nconsole.log(top.join(' '));`,
      cppStart: CPP_STD_START("Top K frequent elements"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,k;cin>>n>>k;unordered_map<int,int>f;for(int i=0;i<n;i++){int x;cin>>x;f[x]++;}vector<pair<int,int>>v(f.begin(),f.end());sort(v.begin(),v.end(),[](auto&a,auto&b){return a.second!=b.second?a.second>b.second:a.first<b.first;});for(int i=0;i<k;i++)cout<<(i?" ":"")<<v[i].first;}`,
      javaStart: JAVA_STD_START("Top K frequent elements"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),k=sc.nextInt();Map<Integer,Integer>f=new HashMap<>();for(int i=0;i<n;i++){int x=sc.nextInt();f.put(x,f.getOrDefault(x,0)+1);}List<Map.Entry<Integer,Integer>>l=new ArrayList<>(f.entrySet());l.sort((a,b)->!a.getValue().equals(b.getValue())?b.getValue()-a.getValue():a.getKey()-b.getKey());StringBuilder sb=new StringBuilder();for(int i=0;i<k;i++){if(i>0)sb.append(' ');sb.append(l.get(i).getKey());}System.out.print(sb);}}`,
    }),
  },
];

module.exports = { PART_1, makeCodes, JS_STD_START, CPP_STD_START, JAVA_STD_START };
