## 2024-05-18 - Optimized isConnectedGroup to O(N) single-pass
**Learning:** The matching engine iterates through thousands of valid sequences for groups of 3+ riders. The `isConnectedGroup` check inside this loop was doing heavy O(N^2) array operations (`findIndex`, `map`, `some`) causing the engine to spend ~600ms out of 2.8s checking sequence connectedness.
**Action:** Replace `findIndex`/`some` combinations in inner loops with linear O(N) trackers when verifying logical constraints across a sequential path.
