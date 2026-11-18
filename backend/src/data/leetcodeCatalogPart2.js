// ---------------------------------------------------------------------------
// Curated LeetCode Problem Catalog — Part 2 (Problems 31–60: 18 Medium + 12 Hard)
// ---------------------------------------------------------------------------

const {
  makeCodes,
  JS_STD_START,
  CPP_STD_START,
  JAVA_STD_START,
} = require("./leetcodeCatalogPart1");

const PART_2 = [
  // 31. Search in Rotated Sorted Array (Medium, binarySearch)
  {
    title: "Search in Rotated Sorted Array",
    difficulty: "medium",
    tags: "binarySearch",
    description:
      "Given a rotated ascending array of distinct integers `nums` and a `target`, return its 0-based index in `O(log n)` time, or `-1` if not present.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers\n- Line 3: `target`",
    visibleTestCases: [
      { input: "7\n4 5 6 7 0 1 2\n0", output: "4", explanation: "0 is at index 4." },
      { input: "7\n4 5 6 7 0 1 2\n3", output: "-1", explanation: "3 is not in the array." },
    ],
    hiddenTestCases: [
      { input: "1\n1\n0", output: "-1" },
      { input: "5\n5 1 2 3 4\n5", output: "0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Binary search in rotated sorted array"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], a = d.slice(1, 1 + n), t = d[1 + n];\nlet l = 0, r = n - 1, ans = -1;\nwhile (l <= r) {\n  const m = (l + r) >> 1;\n  if (a[m] === t) { ans = m; break; }\n  if (a[l] <= a[m]) { if (a[l] <= t && t < a[m]) r = m - 1; else l = m + 1; }\n  else { if (a[m] < t && t <= a[r]) l = m + 1; else r = m - 1; }\n}\nconsole.log(ans);`,
      cppStart: CPP_STD_START("Rotated binary search"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;int t;cin>>t;int l=0,r=n-1;while(l<=r){int m=l+(r-l)/2;if(a[m]==t){cout<<m;return 0;}if(a[l]<=a[m]){if(a[l]<=t&&t<a[m])r=m-1;else l=m+1;}else{if(a[m]<t&&t<=a[r])l=m+1;else r=m-1;}}cout<<-1;}`,
      javaStart: JAVA_STD_START("Rotated binary search"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();int t=sc.nextInt(),l=0,r=n-1;while(l<=r){int m=l+(r-l)/2;if(a[m]==t){System.out.print(m);return;}if(a[l]<=a[m]){if(a[l]<=t&&t<a[m])r=m-1;else l=m+1;}else{if(a[m]<t&&t<=a[r])l=m+1;else r=m-1;}}System.out.print(-1);}}`,
    }),
  },

  // 32. Find Minimum in Rotated Sorted Array (Medium, binarySearch)
  {
    title: "Find Minimum in Rotated Sorted Array",
    difficulty: "medium",
    tags: "binarySearch",
    description:
      "Given a rotated sorted array of unique integers `nums`, find the minimum element in `O(log n)` time.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "5\n3 4 5 1 2", output: "1", explanation: "Minimum element is 1." },
      { input: "7\n4 5 6 7 0 1 2", output: "0", explanation: "Minimum element is 0." },
    ],
    hiddenTestCases: [
      { input: "4\n11 13 15 17", output: "11" },
      { input: "2\n2 1", output: "1" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Binary search minimum in rotated array"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst a = d.slice(1, 1 + d[0]);\nlet l = 0, r = a.length - 1;\nwhile (l < r) { const m = (l + r) >> 1; if (a[m] > a[r]) l = m + 1; else r = m; }\nconsole.log(a[l]);`,
      cppStart: CPP_STD_START("Find minimum in rotated array"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;int l=0,r=n-1;while(l<r){int m=l+(r-l)/2;if(a[m]>a[r])l=m+1;else r=m;}cout<<a[l];}`,
      javaStart: JAVA_STD_START("Find minimum in rotated array"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();int l=0,r=n-1;while(l<r){int m=l+(r-l)/2;if(a[m]>a[r])l=m+1;else r=m;}System.out.print(a[l]);}}`,
    }),
  },

  // 33. Koko Eating Bananas (Medium, binarySearch)
  {
    title: "Koko Eating Bananas",
    difficulty: "medium",
    tags: "binarySearch",
    description:
      "Given `n` piles of bananas and `h` hours, Koko chooses an eating speed `k` bananas/hour. Find the minimum integer `k` such that she can eat all bananas within `h` hours.\n\n**Input Format:**\n- Line 1: `n h`\n- Line 2: `n` pile sizes",
    visibleTestCases: [
      { input: "4 8\n3 6 7 11", output: "4", explanation: "At k=4: 1+2+2+3 = 8 hours." },
      { input: "5 5\n30 11 23 4 20", output: "30", explanation: "Must finish 1 pile per hour -> k=30." },
    ],
    hiddenTestCases: [
      { input: "5 6\n30 11 23 4 20", output: "23" },
      { input: "1 2\n10", output: "5" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Binary search on eating speed k"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], h = d[1], piles = d.slice(2, 2 + n);\nlet l = 1, r = Math.max(...piles);\nwhile (l < r) {\n  const m = Math.floor((l + r) / 2);\n  let hrs = 0; for (const p of piles) hrs += Math.ceil(p / m);\n  if (hrs <= h) r = m; else l = m + 1;\n}\nconsole.log(l);`,
      cppStart: CPP_STD_START("Koko eating bananas binary search"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;long long h;cin>>n>>h;vector<long long>p(n);long long mx=0;for(auto&x:p){cin>>x;mx=max(mx,x);}long long l=1,r=mx;while(l<r){long long m=l+(r-l)/2,hrs=0;for(auto x:p)hrs+=(x+m-1)/m;if(hrs<=h)r=m;else l=m+1;}cout<<l;}`,
      javaStart: JAVA_STD_START("Koko eating bananas binary search"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long h=sc.nextLong();long[]p=new long[n];long mx=0;for(int i=0;i<n;i++){p[i]=sc.nextLong();mx=Math.max(mx,p[i]);}long l=1,r=mx;while(l<r){long m=l+(r-l)/2,hrs=0;for(long x:p)hrs+=(x+m-1)/m;if(hrs<=h)r=m;else l=m+1;}System.out.print(l);}}`,
    }),
  },

  // 34. Coin Change (Medium, dp)
  {
    title: "Coin Change",
    difficulty: "medium",
    tags: "dp",
    description:
      "Given coin denominations `coins` and a target `amount`, return the fewest number of coins needed to make up `amount`, or `-1` if impossible.\n\n**Input Format:**\n- Line 1: `n amount`\n- Line 2: `n` coin denominations",
    visibleTestCases: [
      { input: "3 11\n1 2 5", output: "3", explanation: "11 = 5 + 5 + 1." },
      { input: "1 3\n2", output: "-1", explanation: "Cannot form 3 with coin 2." },
    ],
    hiddenTestCases: [
      { input: "1 0\n1", output: "0" },
      { input: "4 6249\n186 419 83 408", output: "20" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Bottom-up DP for minimum coins"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], amt = d[1], coins = d.slice(2, 2 + n);\nconst dp = new Array(amt + 1).fill(amt + 1); dp[0] = 0;\nfor (let i = 1; i <= amt; i++) for (const c of coins) if (i >= c) dp[i] = Math.min(dp[i], dp[i - c] + 1);\nconsole.log(dp[amt] > amt ? -1 : dp[amt]);`,
      cppStart: CPP_STD_START("Coin change DP"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,amt;cin>>n>>amt;vector<int>c(n);for(int&x:c)cin>>x;vector<int>dp(amt+1,amt+1);dp[0]=0;for(int i=1;i<=amt;i++)for(int v:c)if(i>=v)dp[i]=min(dp[i],dp[i-v]+1);cout<<(dp[amt]>amt?-1:dp[amt]);}`,
      javaStart: JAVA_STD_START("Coin change DP"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),amt=sc.nextInt();int[]c=new int[n];for(int i=0;i<n;i++)c[i]=sc.nextInt();int[]dp=new int[amt+1];Arrays.fill(dp,amt+1);dp[0]=0;for(int i=1;i<=amt;i++)for(int v:c)if(i>=v)dp[i]=Math.min(dp[i],dp[i-v]+1);System.out.print(dp[amt]>amt?-1:dp[amt]);}}`,
    }),
  },

  // 35. House Robber (Medium, dp)
  {
    title: "House Robber",
    difficulty: "medium",
    tags: "dp",
    description:
      "You cannot rob two adjacent houses on the same night. Given the money stashed in each house, compute the maximum amount you can rob.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "4\n1 2 3 1", output: "4", explanation: "Rob house 0 (1) + house 2 (3) = 4." },
      { input: "5\n2 7 9 3 1", output: "12", explanation: "Rob 2 + 9 + 1 = 12." },
    ],
    hiddenTestCases: [
      { input: "1\n10", output: "10" },
      { input: "4\n2 1 1 2", output: "4" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("House Robber O(1) space DP"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet p2 = 0, p1 = 0;\nfor (let i = 1; i <= d[0]; i++) { const cur = Math.max(p1, p2 + d[i]); p2 = p1; p1 = cur; }\nconsole.log(p1);`,
      cppStart: CPP_STD_START("House Robber DP"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;long long p2=0,p1=0,x;while(n--){cin>>x;long long c=max(p1,p2+x);p2=p1;p1=c;}cout<<p1;}`,
      javaStart: JAVA_STD_START("House Robber DP"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long p2=0,p1=0;while(n-->0){long c=Math.max(p1,p2+sc.nextLong());p2=p1;p1=c;}System.out.print(p1);}}`,
    }),
  },

  // 36. Longest Increasing Subsequence (Medium, dp)
  {
    title: "Longest Increasing Subsequence",
    difficulty: "medium",
    tags: "dp",
    description:
      "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "8\n10 9 2 5 3 7 101 18", output: "4", explanation: "LIS is [2,3,7,101] of length 4." },
      { input: "6\n0 1 0 3 2 3", output: "4", explanation: "[0,1,2,3] has length 4." },
    ],
    hiddenTestCases: [
      { input: "5\n7 7 7 7 7", output: "1" },
      { input: "5\n1 2 3 4 5", output: "5" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Patience sorting O(n log n) LIS"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst tails = [];\nfor (let i = 1; i <= d[0]; i++) {\n  const x = d[i]; let l = 0, r = tails.length;\n  while (l < r) { const m = (l + r) >> 1; if (tails[m] < x) l = m + 1; else r = m; }\n  tails[l] = x;\n}\nconsole.log(tails.length);`,
      cppStart: CPP_STD_START("LIS O(n log n)"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>t;while(n--){int x;cin>>x;auto it=lower_bound(t.begin(),t.end(),x);if(it==t.end())t.push_back(x);else *it=x;}cout<<t.size();}`,
      javaStart: JAVA_STD_START("LIS O(n log n)"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]t=new int[n];int sz=0;while(n-->0){int x=sc.nextInt(),l=0,r=sz;while(l<r){int m=(l+r)>>>1;if(t[m]<x)l=m+1;else r=m;}t[l]=x;if(l==sz)sz++;}System.out.print(sz);}}`,
    }),
  },

  // 37. Longest Common Subsequence (Medium, dp)
  {
    title: "Longest Common Subsequence",
    difficulty: "medium",
    tags: "dp",
    description:
      "Given two strings `text1` and `text2`, return the length of their longest common subsequence.\n\n**Input Format:**\n- Line 1: `text1`\n- Line 2: `text2`",
    visibleTestCases: [
      { input: "abcde\nace", output: "3", explanation: "LCS is 'ace' of length 3." },
      { input: "abc\ndef", output: "0", explanation: "No common characters." },
    ],
    hiddenTestCases: [
      { input: "abc\nabc", output: "3" },
      { input: "bsbininm\njmjkbkjkv", output: "1" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("2D DP for LCS"),
      jsSol: `const fs = require('fs');\nconst [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst m = a.length, n = b.length;\nconst dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));\nfor (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);\nconsole.log(dp[m][n]);`,
      cppStart: CPP_STD_START("LCS DP"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string a,b;cin>>a>>b;int m=a.size(),n=b.size();vector<vector<int>>dp(m+1,vector<int>(n+1,0));for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=a[i-1]==b[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1]);cout<<dp[m][n];}`,
      javaStart: JAVA_STD_START("LCS DP"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String a=sc.next(),b=sc.next();int m=a.length(),n=b.length();int[][]dp=new int[m+1][n+1];for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=a.charAt(i-1)==b.charAt(j-1)?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);System.out.print(dp[m][n]);}}`,
    }),
  },

  // 38. Unique Paths (Medium, dp)
  {
    title: "Unique Paths",
    difficulty: "medium",
    tags: "dp",
    description:
      "A robot sits at the top-left corner of an `m x n` grid and can only move right or down. Return the number of unique paths to the bottom-right corner.\n\n**Input Format:**\n- Line 1: `m n`",
    visibleTestCases: [
      { input: "3 7", output: "28", explanation: "C(8,2) = 28 paths." },
      { input: "3 2", output: "3", explanation: "3 unique paths." },
    ],
    hiddenTestCases: [
      { input: "1 1", output: "1" },
      { input: "7 3", output: "28" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Grid DP for unique paths"),
      jsSol: `const fs = require('fs');\nconst [m, n] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst dp = new Array(n).fill(1);\nfor (let i = 1; i < m; i++) for (let j = 1; j < n; j++) dp[j] += dp[j - 1];\nconsole.log(dp[n - 1]);`,
      cppStart: CPP_STD_START("Unique paths DP"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int m,n;cin>>m>>n;vector<long long>dp(n,1);for(int i=1;i<m;i++)for(int j=1;j<n;j++)dp[j]+=dp[j-1];cout<<dp[n-1];}`,
      javaStart: JAVA_STD_START("Unique paths DP"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();long[]dp=new long[n];Arrays.fill(dp,1);for(int i=1;i<m;i++)for(int j=1;j<n;j++)dp[j]+=dp[j-1];System.out.print(dp[n-1]);}}`,
    }),
  },

  // 39. Jump Game (Medium, greedy)
  {
    title: "Jump Game",
    difficulty: "medium",
    tags: "greedy",
    description:
      "Given an array `nums` where `nums[i]` is the maximum jump length from index `i`, print `true` if you can reach the last index, else `false`.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` non-negative integers",
    visibleTestCases: [
      { input: "5\n2 3 1 1 4", output: "true", explanation: "Jump 0->1->4." },
      { input: "5\n3 2 1 0 4", output: "false", explanation: "Always stuck at index 3." },
    ],
    hiddenTestCases: [
      { input: "1\n0", output: "true" },
      { input: "3\n2 0 0", output: "true" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Greedy max reachable index"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], a = d.slice(1, 1 + n);\nlet reach = 0, ok = true;\nfor (let i = 0; i < n; i++) { if (i > reach) { ok = false; break; } reach = Math.max(reach, i + a[i]); }\nconsole.log(ok ? 'true' : 'false');`,
      cppStart: CPP_STD_START("Jump game greedy"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;int r=0;for(int i=0;i<n;i++){int x;cin>>x;if(i>r){cout<<"false";return 0;}r=max(r,i+x);}cout<<"true";}`,
      javaStart: JAVA_STD_START("Jump game greedy"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),r=0;for(int i=0;i<n;i++){int x=sc.nextInt();if(i>r){System.out.print("false");return;}r=Math.max(r,i+x);}System.out.print("true");}}`,
    }),
  },

  // 40. Jump Game II (Medium, greedy)
  {
    title: "Jump Game II",
    difficulty: "medium",
    tags: "greedy",
    description:
      "Given an array `nums` where you can always reach the last index, return the minimum number of jumps required to reach index `n - 1`.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "5\n2 3 1 1 4", output: "2", explanation: "0 -> 1 -> 4 takes 2 jumps." },
      { input: "5\n2 3 0 1 4", output: "2", explanation: "0 -> 1 -> 4 takes 2 jumps." },
    ],
    hiddenTestCases: [
      { input: "1\n0", output: "0" },
      { input: "4\n1 1 1 1", output: "3" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Greedy BFS-level minimum jumps"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], a = d.slice(1, 1 + n);\nlet jumps = 0, curEnd = 0, far = 0;\nfor (let i = 0; i < n - 1; i++) { far = Math.max(far, i + a[i]); if (i === curEnd) { jumps++; curEnd = far; } }\nconsole.log(jumps);`,
      cppStart: CPP_STD_START("Jump Game II greedy"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;int j=0,e=0,f=0;for(int i=0;i<n-1;i++){f=max(f,i+a[i]);if(i==e){j++;e=f;}}cout<<j;}`,
      javaStart: JAVA_STD_START("Jump Game II greedy"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();int j=0,e=0,f=0;for(int i=0;i<n-1;i++){f=Math.max(f,i+a[i]);if(i==e){j++;e=f;}}System.out.print(j);}}`,
    }),
  },

  // 41. Gas Station (Medium, greedy)
  {
    title: "Gas Station",
    difficulty: "medium",
    tags: "greedy",
    description:
      "There are `n` gas stations along a circular route. Station `i` has `gas[i]` fuel and costs `cost[i]` to reach `i + 1`. Return the starting station index to complete a full circuit, or `-1` if impossible.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` gas values\n- Line 3: `n` cost values",
    visibleTestCases: [
      { input: "5\n1 2 3 4 5\n3 4 5 1 2", output: "3", explanation: "Start at station 3 to complete the loop." },
      { input: "3\n2 3 4\n3 4 3", output: "-1", explanation: "Total gas < total cost." },
    ],
    hiddenTestCases: [
      { input: "1\n5\n4", output: "0" },
      { input: "4\n5 1 2 3\n4 4 1 5", output: "-1" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Greedy circular gas station"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], gas = d.slice(1, 1 + n), cost = d.slice(1 + n, 1 + 2 * n);\nlet total = 0, tank = 0, start = 0;\nfor (let i = 0; i < n; i++) { const diff = gas[i] - cost[i]; total += diff; tank += diff; if (tank < 0) { start = i + 1; tank = 0; } }\nconsole.log(total >= 0 ? start : -1);`,
      cppStart: CPP_STD_START("Gas station greedy"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>g(n),c(n);for(int&x:g)cin>>x;for(int&x:c)cin>>x;int tot=0,tk=0,st=0;for(int i=0;i<n;i++){int df=g[i]-c[i];tot+=df;tk+=df;if(tk<0){st=i+1;tk=0;}}cout<<(tot>=0?st:-1);}`,
      javaStart: JAVA_STD_START("Gas station greedy"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]g=new int[n],c=new int[n];for(int i=0;i<n;i++)g[i]=sc.nextInt();for(int i=0;i<n;i++)c[i]=sc.nextInt();int tot=0,tk=0,st=0;for(int i=0;i<n;i++){int df=g[i]-c[i];tot+=df;tk+=df;if(tk<0){st=i+1;tk=0;}}System.out.print(tot>=0?st:-1);}}`,
    }),
  },

  // 42. Number of Islands (Medium, graph)
  {
    title: "Number of Islands",
    difficulty: "medium",
    tags: "graph",
    description:
      "Given an `m x n` binary grid of `'1'` (land) and `'0'` (water), return the number of connected islands (4-directional).\n\n**Input Format:**\n- Line 1: `m n`\n- Next `m` lines: binary string of length `n`",
    visibleTestCases: [
      { input: "4 5\n11110\n11010\n11000\n00000", output: "1", explanation: "One connected landmass." },
      { input: "4 5\n11000\n11000\n00100\n00011", output: "3", explanation: "Three separate islands." },
    ],
    hiddenTestCases: [
      { input: "2 2\n00\n00", output: "0" },
      { input: "3 3\n101\n010\n101", output: "5" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Count connected components in grid"),
      jsSol: `const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst m = Number(lines[0]), n = Number(lines[1]);\nconst g = lines.slice(2, 2 + m).map(r => r.split(''));\nlet cnt = 0;\nconst dfs = (r, c) => {\n  const st = [[r, c]]; g[r][c] = '0';\n  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < m && ny >= 0 && ny < n && g[nx][ny] === '1') { g[nx][ny] = '0'; st.push([nx, ny]); } } }\n};\nfor (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (g[i][j] === '1') { cnt++; dfs(i, j); }\nconsole.log(cnt);`,
      cppStart: CPP_STD_START("Number of islands BFS/DFS"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int m,n;cin>>m>>n;vector<string>g(m);for(auto&s:g)cin>>s;int c=0,dx[4]={1,-1,0,0},dy[4]={0,0,1,-1};for(int i=0;i<m;i++)for(int j=0;j<n;j++)if(g[i][j]=='1'){c++;queue<pair<int,int>>q;q.push({i,j});g[i][j]='0';while(!q.empty()){auto[x,y]=q.front();q.pop();for(int d=0;d<4;d++){int nx=x+dx[d],ny=y+dy[d];if(nx>=0&&nx<m&&ny>=0&&ny<n&&g[nx][ny]=='1'){g[nx][ny]='0';q.push({nx,ny});}}}}cout<<c;}`,
      javaStart: JAVA_STD_START("Number of islands BFS/DFS"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();char[][]g=new char[m][];for(int i=0;i<m;i++)g[i]=sc.next().toCharArray();int c=0;int[]dx={1,-1,0,0},dy={0,0,1,-1};for(int i=0;i<m;i++)for(int j=0;j<n;j++)if(g[i][j]=='1'){c++;Deque<int[]>q=new ArrayDeque<>();q.add(new int[]{i,j});g[i][j]='0';while(!q.isEmpty()){int[]p=q.poll();for(int d=0;d<4;d++){int nx=p[0]+dx[d],ny=p[1]+dy[d];if(nx>=0&&nx<m&&ny>=0&&ny<n&&g[nx][ny]=='1'){g[nx][ny]='0';q.add(new int[]{nx,ny});}}}}System.out.print(c);}}`,
    }),
  },

  // 43. Course Schedule (Medium, graph)
  {
    title: "Course Schedule",
    difficulty: "medium",
    tags: "graph",
    description:
      "There are `numCourses` courses labeled `0` to `numCourses - 1` and `m` prerequisite pairs `a b` (must take `b` before `a`). Print `true` if you can finish all courses (no cycle), else `false`.\n\n**Input Format:**\n- Line 1: `numCourses m`\n- Next `m` lines: `a b`",
    visibleTestCases: [
      { input: "2 1\n1 0", output: "true", explanation: "Take 0 then 1." },
      { input: "2 2\n1 0\n0 1", output: "false", explanation: "Cycle 0 <-> 1 makes completion impossible." },
    ],
    hiddenTestCases: [
      { input: "4 3\n1 0\n2 1\n3 2", output: "true" },
      { input: "3 3\n0 1\n1 2\n2 0", output: "false" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Kahn's topological sort cycle detection"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], m = d[1];\nconst adj = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);\nfor (let i = 0; i < m; i++) { const a = d[2 + 2 * i], b = d[3 + 2 * i]; adj[b].push(a); indeg[a]++; }\nconst q = []; for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);\nlet seen = 0;\nfor (let h = 0; h < q.length; h++) { const u = q[h]; seen++; for (const v of adj[u]) if (--indeg[v] === 0) q.push(v); }\nconsole.log(seen === n ? 'true' : 'false');`,
      cppStart: CPP_STD_START("Course schedule topological sort"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,m;cin>>n>>m;vector<vector<int>>adj(n);vector<int>in(n,0);while(m--){int a,b;cin>>a>>b;adj[b].push_back(a);in[a]++;}queue<int>q;for(int i=0;i<n;i++)if(!in[i])q.push(i);int c=0;while(!q.empty()){int u=q.front();q.pop();c++;for(int v:adj[u])if(--in[v]==0)q.push(v);}cout<<(c==n?"true":"false");}`,
      javaStart: JAVA_STD_START("Course schedule topological sort"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),m=sc.nextInt();List<List<Integer>>adj=new ArrayList<>();for(int i=0;i<n;i++)adj.add(new ArrayList<>());int[]in=new int[n];while(m-->0){int a=sc.nextInt(),b=sc.nextInt();adj.get(b).add(a);in[a]++;}Deque<Integer>q=new ArrayDeque<>();for(int i=0;i<n;i++)if(in[i]==0)q.add(i);int c=0;while(!q.isEmpty()){int u=q.poll();c++;for(int v:adj.get(u))if(--in[v]==0)q.add(v);}System.out.print(c==n?"true":"false");}}`,
    }),
  },

  // 44. Rotting Oranges (Medium, graph)
  {
    title: "Rotting Oranges",
    difficulty: "medium",
    tags: "graph",
    description:
      "In an `m x n` grid, `0` = empty, `1` = fresh orange, `2` = rotten orange. Every minute, fresh oranges 4-directionally adjacent to a rotten orange rot. Return the minimum minutes until no fresh orange remains, or `-1` if impossible.\n\n**Input Format:**\n- Line 1: `m n`\n- Next `m` lines: `n` integers (`0`, `1`, or `2`)",
    visibleTestCases: [
      { input: "3 3\n2 1 1\n1 1 0\n0 1 1", output: "4", explanation: "All oranges rot in 4 minutes." },
      { input: "3 3\n2 1 1\n0 1 1\n1 0 1", output: "-1", explanation: "Bottom-left orange is unreachable." },
    ],
    hiddenTestCases: [
      { input: "1 2\n0 2", output: "0" },
      { input: "1 2\n1 2", output: "1" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Multi-source BFS for rotting oranges"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst m = d[0], n = d[1], g = [];\nlet idx = 2, fresh = 0, q = [];\nfor (let i = 0; i < m; i++) { const row = []; for (let j = 0; j < n; j++) { const v = d[idx++]; row.push(v); if (v === 1) fresh++; else if (v === 2) q.push([i, j, 0]); } g.push(row); }\nlet mins = 0;\nfor (let h = 0; h < q.length; h++) {\n  const [x, y, t] = q[h]; mins = Math.max(mins, t);\n  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {\n    const nx = x + dx, ny = y + dy;\n    if (nx >= 0 && nx < m && ny >= 0 && ny < n && g[nx][ny] === 1) { g[nx][ny] = 2; fresh--; q.push([nx, ny, t + 1]); }\n  }\n}\nconsole.log(fresh === 0 ? mins : -1);`,
      cppStart: CPP_STD_START("Multi-source BFS rotting oranges"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int m,n;cin>>m>>n;vector<vector<int>>g(m,vector<int>(n));queue<array<int,3>>q;int fr=0,ans=0;for(int i=0;i<m;i++)for(int j=0;j<n;j++){cin>>g[i][j];if(g[i][j]==1)fr++;else if(g[i][j]==2)q.push({i,j,0});}int dx[4]={1,-1,0,0},dy[4]={0,0,1,-1};while(!q.empty()){auto[x,y,t]=q.front();q.pop();ans=max(ans,t);for(int d=0;d<4;d++){int nx=x+dx[d],ny=y+dy[d];if(nx>=0&&nx<m&&ny>=0&&ny<n&&g[nx][ny]==1){g[nx][ny]=2;fr--;q.push({nx,ny,t+1});}}}cout<<(fr==0?ans:-1);}`,
      javaStart: JAVA_STD_START("Multi-source BFS rotting oranges"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();int[][]g=new int[m][n];Deque<int[]>q=new ArrayDeque<>();int fr=0,ans=0;for(int i=0;i<m;i++)for(int j=0;j<n;j++){g[i][j]=sc.nextInt();if(g[i][j]==1)fr++;else if(g[i][j]==2)q.add(new int[]{i,j,0});}int[]dx={1,-1,0,0},dy={0,0,1,-1};while(!q.isEmpty()){int[]p=q.poll();ans=Math.max(ans,p[2]);for(int d=0;d<4;d++){int nx=p[0]+dx[d],ny=p[1]+dy[d];if(nx>=0&&nx<m&&ny>=0&&ny<n&&g[nx][ny]==1){g[nx][ny]=2;fr--;q.add(new int[]{nx,ny,p[2]+1});}}}System.out.print(fr==0?ans:-1);}}`,
    }),
  },

  // 45. Subarray Sum Equals K (Medium, map)
  {
    title: "Subarray Sum Equals K",
    difficulty: "medium",
    tags: "map",
    description:
      "Given an array of integers `nums` and an integer `k`, return the total number of contiguous subarrays whose sum equals `k`.\n\n**Input Format:**\n- Line 1: `n k`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "3 2\n1 1 1", output: "2", explanation: "[1,1] at indices (0..1) and (1..2)." },
      { input: "3 3\n1 2 3", output: "2", explanation: "[1,2] and [3]." },
    ],
    hiddenTestCases: [
      { input: "3 0\n1 -1 0", output: "3" },
      { input: "1 5\n5", output: "1" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Prefix sum + HashMap count"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1], mp = new Map([[0, 1]]);\nlet sum = 0, ans = 0;\nfor (let i = 2; i < 2 + n; i++) { sum += d[i]; ans += mp.get(sum - k) || 0; mp.set(sum, (mp.get(sum) || 0) + 1); }\nconsole.log(ans);`,
      cppStart: CPP_STD_START("Subarray sum equals K"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,k;cin>>n>>k;unordered_map<long long,int>m;m[0]=1;long long s=0,ans=0;while(n--){int x;cin>>x;s+=x;if(m.count(s-k))ans+=m[s-k];m[s]++;}cout<<ans;}`,
      javaStart: JAVA_STD_START("Subarray sum equals K"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),k=sc.nextInt();Map<Long,Integer>m=new HashMap<>();m.put(0L,1);long s=0,ans=0;while(n-->0){s+=sc.nextInt();ans+=m.getOrDefault(s-k,0);m.put(s,m.getOrDefault(s,0)+1);}System.out.print(ans);}}`,
    }),
  },

  // 46. Merge Intervals Count (Medium, array)
  {
    title: "Merge Intervals",
    difficulty: "medium",
    tags: "array",
    description:
      "Given `n` intervals `[start, end]`, merge all overlapping intervals and print the resulting merged intervals as `start end` on each line (or total merged count on line 1? Output: space-separated pairs `s1 e1 s2 e2 ...` sorted by start).\n\n**Input Format:**\n- Line 1: `n`\n- Next `n` lines: `start end`\n\n**Output Format:**\n- Merged intervals formatted as `s1-e1 s2-e2 ...`",
    visibleTestCases: [
      { input: "4\n1 3\n2 6\n8 10\n15 18", output: "1-6 8-10 15-18", explanation: "[1,3] and [2,6] merge into [1,6]." },
      { input: "2\n1 4\n4 5", output: "1-5", explanation: "Touching intervals merge." },
    ],
    hiddenTestCases: [
      { input: "3\n5 7\n1 3\n2 6", output: "1-7" },
      { input: "1\n0 0", output: "0-0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Sort intervals and merge overlaps"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], iv = [];\nfor (let i = 0; i < n; i++) iv.push([d[1 + 2 * i], d[2 + 2 * i]]);\niv.sort((a, b) => a[0] - b[0] || a[1] - b[1]);\nconst res = [];\nfor (const [s, e] of iv) { if (!res.length || res[res.length - 1][1] < s) res.push([s, e]); else res[res.length - 1][1] = Math.max(res[res.length - 1][1], e); }\nconsole.log(res.map(([s, e]) => s + '-' + e).join(' '));`,
      cppStart: CPP_STD_START("Merge overlapping intervals"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<pair<int,int>>a(n);for(auto&p:a)cin>>p.first>>p.second;sort(a.begin(),a.end());vector<pair<int,int>>r;for(auto&p:a){if(r.empty()||r.back().second<p.first)r.push_back(p);else r.back().second=max(r.back().second,p.second);}for(int i=0;i<(int)r.size();i++)cout<<(i?" ":"")<<r[i].first<<"-"<<r[i].second;}`,
      javaStart: JAVA_STD_START("Merge overlapping intervals"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[][]a=new int[n][2];for(int i=0;i<n;i++){a[i][0]=sc.nextInt();a[i][1]=sc.nextInt();}Arrays.sort(a,(x,y)->x[0]!=y[0]?x[0]-y[0]:x[1]-y[1]);List<int[]>r=new ArrayList<>();for(int[]p:a){if(r.isEmpty()||r.get(r.size()-1)[1]<p[0])r.add(p);else r.get(r.size()-1)[1]=Math.max(r.get(r.size()-1)[1],p[1]);}StringBuilder sb=new StringBuilder();for(int i=0;i<r.size();i++){if(i>0)sb.append(' ');sb.append(r.get(i)[0]).append('-').append(r.get(i)[1]);}System.out.print(sb);}}`,
    }),
  },

  // 47. Daily Temperatures (Medium, array)
  {
    title: "Daily Temperatures",
    difficulty: "medium",
    tags: "array",
    description:
      "Given daily `temperatures`, for each day print how many days you have to wait until a warmer temperature (or `0` if no warmer day exists).\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` temperatures",
    visibleTestCases: [
      { input: "8\n73 74 75 71 69 72 76 73", output: "1 1 4 2 1 1 0 0", explanation: "Monotonic decreasing stack." },
      { input: "4\n30 40 50 60", output: "1 1 1 0", explanation: "Strictly increasing temperatures." },
    ],
    hiddenTestCases: [
      { input: "3\n90 80 70", output: "0 0 0" },
      { input: "3\n30 60 90", output: "1 1 0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Monotonic stack for next warmer day"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], t = d.slice(1, 1 + n), ans = new Array(n).fill(0), st = [];\nfor (let i = 0; i < n; i++) { while (st.length && t[i] > t[st[st.length - 1]]) { const j = st.pop(); ans[j] = i - j; } st.push(i); }\nconsole.log(ans.join(' '));`,
      cppStart: CPP_STD_START("Monotonic stack daily temperatures"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>t(n),a(n,0),st;for(int&x:t)cin>>x;for(int i=0;i<n;i++){while(!st.empty()&&t[i]>t[st.back()]){a[st.back()]=i-st.back();st.pop_back();}st.push_back(i);}for(int i=0;i<n;i++)cout<<(i?" ":"")<<a[i];}`,
      javaStart: JAVA_STD_START("Monotonic stack daily temperatures"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]t=new int[n],a=new int[n];for(int i=0;i<n;i++)t[i]=sc.nextInt();Deque<Integer>st=new ArrayDeque<>();for(int i=0;i<n;i++){while(!st.isEmpty()&&t[i]>t[st.peek()]){int j=st.pop();a[j]=i-j;}st.push(i);}StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(a[i]);}System.out.print(sb);}}`,
    }),
  },

  // 48. Maximum Depth of Binary Tree (Medium, tree)
  {
    title: "Maximum Depth of Binary Tree",
    difficulty: "medium",
    tags: "tree",
    description:
      "Given a binary tree in level-order array representation (`null` for missing nodes), return its maximum depth.\n\n**Input Format:**\n- Line 1: space-separated level-order tokens (integers or `null`)",
    visibleTestCases: [
      { input: "3 9 20 null null 15 7", output: "3", explanation: "Depth is 3 (3 -> 20 -> 15)." },
      { input: "1 null 2", output: "2", explanation: "Root with one right child -> depth 2." },
    ],
    hiddenTestCases: [
      { input: "1", output: "1" },
      { input: "1 2 null 3 null 4", output: "4" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Build binary tree from level order and compute max depth"),
      jsSol: `const fs = require('fs');\nconst tok = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nif (!tok.length || tok[0] === 'null') { console.log(0); } else {\n  const root = { l: null, r: null }, q = [root]; let i = 1;\n  while (q.length && i < tok.length) {\n    const cur = q.shift();\n    if (i < tok.length && tok[i] !== 'null') { cur.l = { l: null, r: null }; q.push(cur.l); } i++;\n    if (i < tok.length && tok[i] !== 'null') { cur.r = { l: null, r: null }; q.push(cur.r); } i++;\n  }\n  const depth = (nd) => nd ? 1 + Math.max(depth(nd.l), depth(nd.r)) : 0;\n  console.log(depth(root));\n}`,
      cppStart: CPP_STD_START("Binary tree max depth"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nstruct N{N*l=0,*r=0;};int D(N*x){return x?1+max(D(x->l),D(x->r)):0;}\nint main(){vector<string>t;string s;while(cin>>s)t.push_back(s);if(t.empty()||t[0]=="null"){cout<<0;return 0;}N*root=new N();queue<N*>q;q.push(root);size_t i=1;while(!q.empty()&&i<t.size()){N*c=q.front();q.pop();if(i<t.size()&&t[i]!="null"){c->l=new N();q.push(c->l);}i++;if(i<t.size()&&t[i]!="null"){c->r=new N();q.push(c->r);}i++;}cout<<D(root);}`,
      javaStart: JAVA_STD_START("Binary tree max depth"),
      javaSol: `import java.util.*;\npublic class Main{static class N{N l,r;}static int D(N x){return x==null?0:1+Math.max(D(x.l),D(x.r));}public static void main(String[] args){Scanner sc=new Scanner(System.in);List<String>t=new ArrayList<>();while(sc.hasNext())t.add(sc.next());if(t.isEmpty()||t.get(0).equals("null")){System.out.print(0);return;}N root=new N();Deque<N>q=new ArrayDeque<>();q.add(root);int i=1;while(!q.isEmpty()&&i<t.size()){N c=q.poll();if(i<t.size()&&!t.get(i).equals("null")){c.l=new N();q.add(c.l);}i++;if(i<t.size()&&!t.get(i).equals("null")){c.r=new N();q.add(c.r);}i++;}System.out.print(D(root));}}`,
    }),
  },

  // 49. Trapping Rain Water (Hard, array)
  {
    title: "Trapping Rain Water",
    difficulty: "hard",
    tags: "array",
    description:
      "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` bar heights",
    visibleTestCases: [
      { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", output: "6", explanation: "6 units of rain water trapped." },
      { input: "6\n4 2 0 3 2 5", output: "9", explanation: "9 units trapped between walls 4 and 5." },
    ],
    hiddenTestCases: [
      { input: "3\n3 0 3", output: "3" },
      { input: "4\n1 2 3 4", output: "0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Two-pointer O(1) space rain water trapping"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst h = d.slice(1, 1 + d[0]);\nlet l = 0, r = h.length - 1, lmax = 0, rmax = 0, ans = 0;\nwhile (l < r) {\n  if (h[l] < h[r]) { lmax = Math.max(lmax, h[l]); ans += lmax - h[l++]; }\n  else { rmax = Math.max(rmax, h[r]); ans += rmax - h[r--]; }\n}\nconsole.log(ans);`,
      cppStart: CPP_STD_START("Trapping rain water two pointers"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long>h(n);for(auto&x:h)cin>>x;int l=0,r=n-1;long long lm=0,rm=0,a=0;while(l<r){if(h[l]<h[r]){lm=max(lm,h[l]);a+=lm-h[l++];}else{rm=max(rm,h[r]);a+=rm-h[r--];}}cout<<a;}`,
      javaStart: JAVA_STD_START("Trapping rain water two pointers"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long[]h=new long[n];for(int i=0;i<n;i++)h[i]=sc.nextLong();int l=0,r=n-1;long lm=0,rm=0,a=0;while(l<r){if(h[l]<h[r]){lm=Math.max(lm,h[l]);a+=lm-h[l++];}else{rm=Math.max(rm,h[r]);a+=rm-h[r--];}}System.out.print(a);}}`,
    }),
  },

  // 50. Median of Two Sorted Arrays (Hard, binarySearch)
  {
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    tags: "binarySearch",
    description:
      "Given two sorted arrays `nums1` and `nums2` of sizes `m` and `n`, print the median formatted to 1 decimal place (e.g. `2.0` or `2.5`) in `O(log(min(m, n)))` time.\n\n**Input Format:**\n- Line 1: `m`, Line 2: `m` sorted ints\n- Line 3: `n`, Line 4: `n` sorted ints",
    visibleTestCases: [
      { input: "2\n1 3\n1\n2", output: "2.0", explanation: "Merged [1,2,3] -> median 2.0." },
      { input: "2\n1 2\n2\n3 4", output: "2.5", explanation: "Merged [1,2,3,4] -> (2+3)/2 = 2.5." },
    ],
    hiddenTestCases: [
      { input: "2\n0 0\n2\n0 0", output: "0.0" },
      { input: "3\n1 5 9\n2\n2 6", output: "5.0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Binary search partition median formatted to 1 decimal"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst m = d[0], a = d.slice(1, 1 + m), n = d[1 + m], b = d.slice(2 + m, 2 + m + n);\nconst c = a.concat(b).sort((x, y) => x - y), len = c.length;\nconst med = len % 2 ? c[len >> 1] : (c[(len >> 1) - 1] + c[len >> 1]) / 2;\nconsole.log(med.toFixed(1));`,
      cppStart: CPP_STD_START("Median of two sorted arrays"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int m,n;cin>>m;vector<int>a(m);for(int&x:a)cin>>x;cin>>n;vector<int>b(n);for(int&x:b)cin>>x;vector<int>c(m+n);merge(a.begin(),a.end(),b.begin(),b.end(),c.begin());int k=m+n;double med=(k%2)?c[k/2]:(c[k/2-1]+c[k/2])/2.0;cout<<fixed<<setprecision(1)<<med;}`,
      javaStart: JAVA_STD_START("Median of two sorted arrays"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int m=sc.nextInt();int[]a=new int[m];for(int i=0;i<m;i++)a[i]=sc.nextInt();int n=sc.nextInt();int[]b=new int[n];for(int i=0;i<n;i++)b[i]=sc.nextInt();int[]c=new int[m+n];System.arraycopy(a,0,c,0,m);System.arraycopy(b,0,c,m,n);Arrays.sort(c);int k=m+n;double med=(k%2==1)?c[k/2]:(c[k/2-1]+c[k/2])/2.0;System.out.printf("%.1f",med);}}`,
    }),
  },

  // 51. Minimum Window Substring (Hard, string)
  {
    title: "Minimum Window Substring",
    difficulty: "hard",
    tags: "string",
    description:
      "Given two strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If no such substring exists, print `NONE`.\n\n**Input Format:**\n- Line 1: `s`\n- Line 2: `t`",
    visibleTestCases: [
      { input: "ADOBECODEBANC\nABC", output: "BANC", explanation: "'BANC' is the shortest substring containing A, B, C." },
      { input: "a\naa", output: "NONE", explanation: "Not enough 'a' characters." },
    ],
    hiddenTestCases: [
      { input: "a\na", output: "a" },
      { input: "aaflslflsldkalskaaa\naaa", output: "aaa" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Sliding window minimum substring covering t"),
      jsSol: `const fs = require('fs');\nconst [s, t] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst need = new Map(); for (const c of t) need.set(c, (need.get(c) || 0) + 1);\nlet missing = t.length, l = 0, bestL = 0, bestLen = Infinity;\nfor (let r = 0; r < s.length; r++) {\n  const c = s[r]; if (need.has(c)) { if (need.get(c) > 0) missing--; need.set(c, need.get(c) - 1); }\n  while (missing === 0) {\n    if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }\n    const lc = s[l++]; if (need.has(lc)) { need.set(lc, need.get(lc) + 1); if (need.get(lc) > 0) missing++; }\n  }\n}\nconsole.log(bestLen === Infinity ? 'NONE' : s.slice(bestL, bestL + bestLen));`,
      cppStart: CPP_STD_START("Minimum window substring"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s,t;cin>>s>>t;vector<int>need(128,0);for(char c:t)need[c]++;int rem=t.size(),l=0,bl=0,blen=INT_MAX;for(int r=0;r<(int)s.size();r++){if(need[s[r]]-->0)rem--;while(rem==0){if(r-l+1<blen){blen=r-l+1;bl=l;}if(++need[s[l++]]>0)rem++;}}cout<<(blen==INT_MAX?"NONE":s.substr(bl,blen));}`,
      javaStart: JAVA_STD_START("Minimum window substring"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String s=sc.next(),t=sc.next();int[]need=new int[128];for(char c:t.toCharArray())need[c]++;int rem=t.length(),l=0,bl=0,blen=Integer.MAX_VALUE;for(int r=0;r<s.length();r++){if(need[s.charAt(r)]-->0)rem--;while(rem==0){if(r-l+1<blen){blen=r-l+1;bl=l;}if(++need[s.charAt(l++)]>0)rem++;}}System.out.print(blen==Integer.MAX_VALUE?"NONE":s.substring(bl,bl+blen));}}`,
    }),
  },

  // 52. Largest Rectangle in Histogram (Hard, array)
  {
    title: "Largest Rectangle in Histogram",
    difficulty: "hard",
    tags: "array",
    description:
      "Given an array of bar heights in a histogram (each bar of width `1`), return the area of the largest rectangle in the histogram.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` bar heights",
    visibleTestCases: [
      { input: "6\n2 1 5 6 2 3", output: "10", explanation: "Bars 5 and 6 form a 5x2 = 10 rectangle." },
      { input: "2\n2 4", output: "4", explanation: "Max area is 4." },
    ],
    hiddenTestCases: [
      { input: "5\n2 2 2 2 2", output: "10" },
      { input: "1\n7", output: "7" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Monotonic increasing stack for histogram"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst h = d.slice(1, 1 + d[0]); h.push(0);\nconst st = []; let best = 0;\nfor (let i = 0; i < h.length; i++) {\n  while (st.length && h[i] < h[st[st.length - 1]]) {\n    const ht = h[st.pop()], w = st.length ? i - st[st.length - 1] - 1 : i;\n    best = Math.max(best, ht * w);\n  }\n  st.push(i);\n}\nconsole.log(best);`,
      cppStart: CPP_STD_START("Largest rectangle in histogram"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long>h(n);for(auto&x:h)cin>>x;h.push_back(0);vector<int>st;long long best=0;for(int i=0;i<=n;i++){while(!st.empty()&&h[i]<h[st.back()]){long long ht=h[st.back()];st.pop_back();long long w=st.empty()?i:i-st.back()-1;best=max(best,ht*w);}st.push_back(i);}cout<<best;}`,
      javaStart: JAVA_STD_START("Largest rectangle in histogram"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long[]h=new long[n+1];for(int i=0;i<n;i++)h[i]=sc.nextLong();Deque<Integer>st=new ArrayDeque<>();long best=0;for(int i=0;i<=n;i++){while(!st.isEmpty()&&h[i]<h[st.peek()]){long ht=h[st.pop()];long w=st.isEmpty()?i:i-st.peek()-1;best=Math.max(best,ht*w);}st.push(i);}System.out.print(best);}}`,
    }),
  },

  // 53. Edit Distance (Hard, dp)
  {
    title: "Edit Distance",
    difficulty: "hard",
    tags: "dp",
    description:
      "Given two words `word1` and `word2`, return the minimum number of operations (insert, delete, or replace a character) required to convert `word1` to `word2`.\n\n**Input Format:**\n- Line 1: `word1`\n- Line 2: `word2`",
    visibleTestCases: [
      { input: "horse\nros", output: "3", explanation: "horse -> rorse -> rose -> ros." },
      { input: "intention\nexecution", output: "5", explanation: "5 edit operations required." },
    ],
    hiddenTestCases: [
      { input: "abc\nabc", output: "0" },
      { input: "kitten\nsitting", output: "3" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Levenshtein Edit Distance DP"),
      jsSol: `const fs = require('fs');\nconst [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst m = a.length, n = b.length;\nconst dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));\nfor (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);\nconsole.log(dp[m][n]);`,
      cppStart: CPP_STD_START("Edit Distance DP"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string a,b;cin>>a>>b;int m=a.size(),n=b.size();vector<vector<int>>dp(m+1,vector<int>(n+1));for(int i=0;i<=m;i++)dp[i][0]=i;for(int j=0;j<=n;j++)dp[0][j]=j;for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=a[i-1]==b[j-1]?dp[i-1][j-1]:1+min({dp[i-1][j],dp[i][j-1],dp[i-1][j-1]});cout<<dp[m][n];}`,
      javaStart: JAVA_STD_START("Edit Distance DP"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String a=sc.next(),b=sc.next();int m=a.length(),n=b.length();int[][]dp=new int[m+1][n+1];for(int i=0;i<=m;i++)dp[i][0]=i;for(int j=0;j<=n;j++)dp[0][j]=j;for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=a.charAt(i-1)==b.charAt(j-1)?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));System.out.print(dp[m][n]);}}`,
    }),
  },

  // 54. Longest Valid Parentheses (Hard, dp)
  {
    title: "Longest Valid Parentheses",
    difficulty: "hard",
    tags: "dp",
    description:
      "Given a string containing only `'('` and `')'`, return the length of the longest valid (well-formed) parentheses substring.\n\n**Input Format:**\n- Line 1: string `s`",
    visibleTestCases: [
      { input: "(()", output: "2", explanation: "Longest valid substring is '()'." },
      { input: ")()())", output: "4", explanation: "Longest valid substring is '()()'." },
    ],
    hiddenTestCases: [
      { input: "(()())", output: "6" },
      { input: "(((", output: "0" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Stack or DP for longest valid parentheses"),
      jsSol: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconst st = [-1]; let best = 0;\nfor (let i = 0; i < s.length; i++) {\n  if (s[i] === '(') st.push(i);\n  else { st.pop(); if (!st.length) st.push(i); else best = Math.max(best, i - st[st.length - 1]); }\n}\nconsole.log(best);`,
      cppStart: CPP_STD_START("Longest valid parentheses"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string s;cin>>s;vector<int>st={-1};int b=0;for(int i=0;i<(int)s.size();i++){if(s[i]=='(')st.push_back(i);else{st.pop_back();if(st.empty())st.push_back(i);else b=max(b,i-st.back());}}cout<<b;}`,
      javaStart: JAVA_STD_START("Longest valid parentheses"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String s=sc.next();Deque<Integer>st=new ArrayDeque<>();st.push(-1);int b=0;for(int i=0;i<s.length();i++){if(s.charAt(i)=='(')st.push(i);else{st.pop();if(st.isEmpty())st.push(i);else b=Math.max(b,i-st.peek());}}System.out.print(b);}}`,
    }),
  },

  // 55. Sliding Window Maximum (Hard, array)
  {
    title: "Sliding Window Maximum",
    difficulty: "hard",
    tags: "array",
    description:
      "Given an array `nums` and a sliding window size `k`, print the maximum value in each window as it slides from left to right in `O(n)` time.\n\n**Input Format:**\n- Line 1: `n k`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "8 3\n1 3 -1 -3 5 3 6 7", output: "3 3 5 5 6 7", explanation: "Monotonic deque tracks window max." },
      { input: "1 1\n1", output: "1", explanation: "Single window of size 1." },
    ],
    hiddenTestCases: [
      { input: "4 2\n9 7 5 3", output: "9 7 5" },
      { input: "5 3\n1 2 3 4 5", output: "3 4 5" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Monotonic deque sliding window max"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], k = d[1], a = d.slice(2, 2 + n), dq = [], res = [];\nlet head = 0;\nfor (let i = 0; i < n; i++) {\n  if (head < dq.length && dq[head] <= i - k) head++;\n  while (head < dq.length && a[dq[dq.length - 1]] <= a[i]) dq.pop();\n  dq.push(i);\n  if (i >= k - 1) res.push(a[dq[head]]);\n}\nconsole.log(res.join(' '));`,
      cppStart: CPP_STD_START("Sliding window maximum deque"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n,k;cin>>n>>k;vector<int>a(n);for(int&x:a)cin>>x;deque<int>dq;bool f=0;for(int i=0;i<n;i++){if(!dq.empty()&&dq.front()<=i-k)dq.pop_front();while(!dq.empty()&&a[dq.back()]<=a[i])dq.pop_back();dq.push_back(i);if(i>=k-1){if(f)cout<<" ";cout<<a[dq.front()];f=1;}}}`,
      javaStart: JAVA_STD_START("Sliding window maximum deque"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),k=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();Deque<Integer>dq=new ArrayDeque<>();StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){if(!dq.isEmpty()&&dq.peekFirst()<=i-k)dq.pollFirst();while(!dq.isEmpty()&&a[dq.peekLast()]<=a[i])dq.pollLast();dq.addLast(i);if(i>=k-1){if(sb.length()>0)sb.append(' ');sb.append(a[dq.peekFirst()]);}}System.out.print(sb);}}`,
    }),
  },

  // 56. Merge K Sorted Lists (Hard, linkedList)
  {
    title: "Merge K Sorted Lists",
    difficulty: "hard",
    tags: "linkedList",
    description:
      "Given `k` sorted linked lists, merge all of them into one sorted linked list and print its values.\n\n**Input Format:**\n- Line 1: `k`\n- Next `k` lines: `len` followed by `len` sorted integers",
    visibleTestCases: [
      { input: "3\n3 1 4 5\n3 1 3 4\n2 2 6", output: "1 1 2 3 4 4 5 6", explanation: "All 3 sorted lists merged via min-heap." },
      { input: "2\n2 -1 5\n2 0 2", output: "-1 0 2 5", explanation: "Merged sorted output." },
    ],
    hiddenTestCases: [
      { input: "1\n3 1 2 3", output: "1 2 3" },
      { input: "3\n1 10\n1 5\n1 1", output: "1 5 10" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Merge k sorted lists"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nlet idx = 0, k = d[idx++], all = [];\nfor (let i = 0; i < k; i++) { const len = d[idx++]; for (let j = 0; j < len; j++) all.push(d[idx++]); }\nall.sort((a, b) => a - b);\nconsole.log(all.join(' '));`,
      cppStart: CPP_STD_START("Merge K sorted lists using priority queue"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int k;cin>>k;priority_queue<int,vector<int>,greater<int>>pq;while(k--){int l,x;cin>>l;while(l--){cin>>x;pq.push(x);}}bool f=0;while(!pq.empty()){if(f)cout<<" ";cout<<pq.top();pq.pop();f=1;}}`,
      javaStart: JAVA_STD_START("Merge K sorted lists using priority queue"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int k=sc.nextInt();PriorityQueue<Integer>pq=new PriorityQueue<>();while(k-->0){int l=sc.nextInt();while(l-->0)pq.add(sc.nextInt());}StringBuilder sb=new StringBuilder();while(!pq.isEmpty()){if(sb.length()>0)sb.append(' ');sb.append(pq.poll());}System.out.print(sb);}}`,
    }),
  },

  // 57. Word Ladder (Hard, graph)
  {
    title: "Word Ladder",
    difficulty: "hard",
    tags: "graph",
    description:
      "Given `beginWord`, `endWord`, and a dictionary of `n` words, return the number of words in the shortest transformation sequence from `beginWord` to `endWord` changing one letter at a time (each intermediate word must be in the dictionary), or `0` if none exists.\n\n**Input Format:**\n- Line 1: `beginWord endWord`\n- Line 2: `n`\n- Line 3: `n` dictionary words",
    visibleTestCases: [
      { input: "hit cog\n6\nhot dot dog lot log cog", output: "5", explanation: "hit -> hot -> dot -> dog -> cog (5 words)." },
      { input: "hit cog\n5\nhot dot dog lot log", output: "0", explanation: "endWord 'cog' is not in dictionary." },
    ],
    hiddenTestCases: [
      { input: "a c\n3\na b c", output: "2" },
      { input: "red tax\n6\nted tex red tax tad den", output: "4" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("BFS shortest word transformation"),
      jsSol: `const fs = require('fs');\nconst p = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\nconst begin = p[0], end = p[1], n = Number(p[2]), dict = new Set(p.slice(3, 3 + n));\nif (!dict.has(end)) { console.log(0); } else {\n  const q = [[begin, 1]]; let ans = 0;\n  for (let h = 0; h < q.length; h++) {\n    const [w, d] = q[h];\n    if (w === end) { ans = d; break; }\n    for (let i = 0; i < w.length; i++) {\n      for (let c = 97; c <= 122; c++) {\n        const nw = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);\n        if (dict.has(nw)) { dict.delete(nw); q.push([nw, d + 1]); }\n      }\n    }\n  }\n  console.log(ans);\n}`,
      cppStart: CPP_STD_START("Word Ladder BFS"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){string b,e;int n;cin>>b>>e>>n;unordered_set<string>dict;while(n--){string w;cin>>w;dict.insert(w);}if(!dict.count(e)){cout<<0;return 0;}queue<pair<string,int>>q;q.push({b,1});while(!q.empty()){auto[w,d]=q.front();q.pop();if(w==e){cout<<d;return 0;}for(size_t i=0;i<w.size();i++){char orig=w[i];for(char c='a';c<='z';c++){w[i]=c;if(dict.count(w)){dict.erase(w);q.push({w,d+1});}}w[i]=orig;}}cout<<0;}`,
      javaStart: JAVA_STD_START("Word Ladder BFS"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);String b=sc.next(),e=sc.next();int n=sc.nextInt();Set<String>dict=new HashSet<>();while(n-->0)dict.add(sc.next());if(!dict.contains(e)){System.out.print(0);return;}Deque<String>q=new ArrayDeque<>();Deque<Integer>dq=new ArrayDeque<>();q.add(b);dq.add(1);while(!q.isEmpty()){String w=q.poll();int d=dq.poll();if(w.equals(e)){System.out.print(d);return;}char[]ch=w.toCharArray();for(int i=0;i<ch.length;i++){char o=ch[i];for(char c='a';c<='z';c++){ch[i]=c;String nw=new String(ch);if(dict.remove(nw)){q.add(nw);dq.add(d+1);}}ch[i]=o;}}System.out.print(0);}}`,
    }),
  },

  // 58. Burst Balloons (Hard, dp)
  {
    title: "Burst Balloons",
    difficulty: "hard",
    tags: "dp",
    description:
      "Given `n` balloons indexed `0` to `n - 1` with numbers `nums[i]`, bursting balloon `i` gives `nums[i-1] * nums[i] * nums[i+1]` coins (out-of-bounds treated as `1`). Return the maximum coins you can collect.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "4\n3 1 5 8", output: "167", explanation: "Optimal burst order yields 167 coins." },
      { input: "2\n1 5", output: "10", explanation: "Burst 1 (5) then 5 (5) = 10." },
    ],
    hiddenTestCases: [
      { input: "1\n7", output: "7" },
      { input: "3\n3 1 5", output: "35" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Interval DP for burst balloons"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst a = [1, ...d.slice(1, 1 + d[0]), 1], m = a.length;\nconst dp = Array.from({ length: m }, () => new Array(m).fill(0));\nfor (let len = 2; len < m; len++) {\n  for (let l = 0; l + len < m; l++) {\n    const r = l + len;\n    for (let k = l + 1; k < r; k++) dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);\n  }\n}\nconsole.log(dp[0][m - 1]);`,
      cppStart: CPP_STD_START("Burst balloons interval DP"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<long long>a(n+2,1);for(int i=1;i<=n;i++)cin>>a[i];int m=n+2;vector<vector<long long>>dp(m,vector<long long>(m,0));for(int len=2;len<m;len++)for(int l=0;l+len<m;l++){int r=l+len;for(int k=l+1;k<r;k++)dp[l][r]=max(dp[l][r],dp[l][k]+dp[k][r]+a[l]*a[k]*a[r]);}cout<<dp[0][m-1];}`,
      javaStart: JAVA_STD_START("Burst balloons interval DP"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();long[]a=new long[n+2];a[0]=a[n+1]=1;for(int i=1;i<=n;i++)a[i]=sc.nextLong();int m=n+2;long[][]dp=new long[m][m];for(int len=2;len<m;len++)for(int l=0;l+len<m;l++){int r=l+len;for(int k=l+1;k<r;k++)dp[l][r]=Math.max(dp[l][r],dp[l][k]+dp[k][r]+a[l]*a[k]*a[r]);}System.out.print(dp[0][m-1]);}}`,
    }),
  },

  // 59. Candy (Hard, greedy)
  {
    title: "Candy",
    difficulty: "hard",
    tags: "greedy",
    description:
      "`n` children stand in a line with ratings `ratings[i]`. Each child must receive at least 1 candy, and children with a higher rating than an immediate neighbor must get more candies than that neighbor. Return the minimum total candies needed.\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` ratings",
    visibleTestCases: [
      { input: "3\n1 0 2", output: "5", explanation: "Candies [2, 1, 2] -> total 5." },
      { input: "3\n1 2 2", output: "4", explanation: "Candies [1, 2, 1] -> total 4." },
    ],
    hiddenTestCases: [
      { input: "5\n1 3 4 5 2", output: "11" },
      { input: "1\n10", output: "1" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Two-pass greedy candy distribution"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], r = d.slice(1, 1 + n), c = new Array(n).fill(1);\nfor (let i = 1; i < n; i++) if (r[i] > r[i - 1]) c[i] = c[i - 1] + 1;\nfor (let i = n - 2; i >= 0; i--) if (r[i] > r[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1);\nconsole.log(c.reduce((s, v) => s + v, 0));`,
      cppStart: CPP_STD_START("Candy two-pass greedy"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>r(n),c(n,1);for(int&x:r)cin>>x;for(int i=1;i<n;i++)if(r[i]>r[i-1])c[i]=c[i-1]+1;for(int i=n-2;i>=0;i--)if(r[i]>r[i+1])c[i]=max(c[i],c[i+1]+1);long long s=0;for(int x:c)s+=x;cout<<s;}`,
      javaStart: JAVA_STD_START("Candy two-pass greedy"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]r=new int[n],c=new int[n];for(int i=0;i<n;i++){r[i]=sc.nextInt();c[i]=1;}for(int i=1;i<n;i++)if(r[i]>r[i-1])c[i]=c[i-1]+1;for(int i=n-2;i>=0;i--)if(r[i]>r[i+1])c[i]=Math.max(c[i],c[i+1]+1);long s=0;for(int x:c)s+=x;System.out.print(s);}}`,
    }),
  },

  // 60. First Missing Positive (Hard, array)
  {
    title: "First Missing Positive",
    difficulty: "hard",
    tags: "array",
    description:
      "Given an unsorted integer array `nums`, find the smallest missing positive integer in `O(n)` time and `O(1)` auxiliary space (cyclic sort).\n\n**Input Format:**\n- Line 1: `n`\n- Line 2: `n` integers",
    visibleTestCases: [
      { input: "3\n1 2 0", output: "3", explanation: "1 and 2 exist; smallest missing positive is 3." },
      { input: "4\n3 4 -1 1", output: "2", explanation: "1 exists; 2 is missing." },
    ],
    hiddenTestCases: [
      { input: "5\n7 8 9 11 12", output: "1" },
      { input: "3\n1 2 3", output: "4" },
    ],
    ...makeCodes({
      jsStart: JS_STD_START("Cyclic sort O(n) time O(1) space"),
      jsSol: `const fs = require('fs');\nconst d = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = d[0], a = d.slice(1, 1 + n);\nfor (let i = 0; i < n; i++) {\n  while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] !== a[i]) {\n    const j = a[i] - 1; [a[i], a[j]] = [a[j], a[i]];\n  }\n}\nlet ans = n + 1;\nfor (let i = 0; i < n; i++) if (a[i] !== i + 1) { ans = i + 1; break; }\nconsole.log(ans);`,
      cppStart: CPP_STD_START("First missing positive cyclic sort"),
      cppSol: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;for(int i=0;i<n;i++)while(a[i]>=1&&a[i]<=n&&a[a[i]-1]!=a[i])swap(a[i],a[a[i]-1]);for(int i=0;i<n;i++)if(a[i]!=i+1){cout<<i+1;return 0;}cout<<n+1;}`,
      javaStart: JAVA_STD_START("First missing positive cyclic sort"),
      javaSol: `import java.util.*;\npublic class Main{public static void main(String[] args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();for(int i=0;i<n;i++)while(a[i]>=1&&a[i]<=n&&a[a[i]-1]!=a[i]){int j=a[i]-1,t=a[i];a[i]=a[j];a[j]=t;}for(int i=0;i<n;i++)if(a[i]!=i+1){System.out.print(i+1);return;}System.out.print(n+1);}}`,
    }),
  },
];

module.exports = { PART_2 };
