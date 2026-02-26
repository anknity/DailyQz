import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DSA_TOPICS, DSA_CATEGORIES, DSA_DIFFICULTY } from '../config/categories';
import LoadingSpinner from '../components/LoadingSpinner';

// Icons Component
const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    search: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    sort: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>,
    filter: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
    check: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    fire: <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>,
    star: <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
    trophy: <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>,
    random: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>,
    list: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  };
  return icons[name] || null;
};

const DSAProblems = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [solvedCount, setSolvedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Sample problems data (will be replaced with API call)
  const sampleProblems = [
    {
      id: 1,
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'easy',
      acceptance: 57.0,
      topics: ['Array', 'Hash Table'],
      companies: ['Google', 'Amazon', 'Facebook'],
      solved: false,
      attempted: false,
      likes: 27400,
      dislikes: 820
    },
    {
      id: 2,
      title: 'Add Two Numbers',
      slug: 'add-two-numbers',
      difficulty: 'medium',
      acceptance: 47.8,
      topics: ['Linked List', 'Math', 'Recursion'],
      companies: ['Microsoft', 'Amazon'],
      solved: false,
      attempted: false,
      likes: 15200,
      dislikes: 3100
    },
    {
      id: 3,
      title: 'Longest Substring Without Repeating Characters',
      slug: 'longest-substring-without-repeating-characters',
      difficulty: 'medium',
      acceptance: 38.3,
      topics: ['String', 'Hash Table', 'Sliding Window'],
      companies: ['Amazon', 'Bloomberg', 'Apple'],
      solved: false,
      attempted: false,
      likes: 25100,
      dislikes: 1200
    },
    {
      id: 4,
      title: 'Median of Two Sorted Arrays',
      slug: 'median-of-two-sorted-arrays',
      difficulty: 'hard',
      acceptance: 45.7,
      topics: ['Array', 'Binary Search', 'Divide and Conquer'],
      companies: ['Google', 'Apple', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 18900,
      dislikes: 2300
    },
    {
      id: 5,
      title: 'Longest Palindromic Substring',
      slug: 'longest-palindromic-substring',
      difficulty: 'medium',
      acceptance: 37.2,
      topics: ['String', 'Dynamic Programming'],
      companies: ['Amazon', 'Microsoft', 'Adobe'],
      solved: false,
      attempted: false,
      likes: 19800,
      dislikes: 1100
    },
    {
      id: 6,
      title: 'Container With Most Water',
      slug: 'container-with-most-water',
      difficulty: 'medium',
      acceptance: 59.4,
      topics: ['Array', 'Two Pointers', 'Greedy'],
      companies: ['Amazon', 'Goldman Sachs', 'Adobe'],
      solved: false,
      attempted: false,
      likes: 16700,
      dislikes: 1200
    },
    {
      id: 7,
      title: 'Roman to Integer',
      slug: 'roman-to-integer',
      difficulty: 'easy',
      acceptance: 66.1,
      topics: ['Hash Table', 'Math', 'String'],
      companies: ['Facebook', 'Microsoft', 'Yahoo'],
      solved: false,
      attempted: false,
      likes: 9700,
      dislikes: 600
    },
    {
      id: 8,
      title: '3Sum',
      slug: '3sum',
      difficulty: 'medium',
      acceptance: 33.8,
      topics: ['Array', 'Two Pointers', 'Sorting'],
      companies: ['Amazon', 'Microsoft', 'Adobe'],
      solved: false,
      attempted: false,
      likes: 20100,
      dislikes: 1900
    },
    {
      id: 9,
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: 'easy',
      acceptance: 42.6,
      topics: ['String', 'Stack'],
      companies: ['Google', 'Amazon', 'Facebook', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 18500,
      dislikes: 950
    },
    {
      id: 10,
      title: 'Merge Two Sorted Lists',
      slug: 'merge-two-sorted-lists',
      difficulty: 'easy',
      acceptance: 65.1,
      topics: ['Linked List', 'Recursion'],
      companies: ['Amazon', 'Apple', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 16200,
      dislikes: 1500
    },
    {
      id: 11,
      title: 'Remove Duplicates from Sorted Array',
      slug: 'remove-duplicates-from-sorted-array',
      difficulty: 'easy',
      acceptance: 55.2,
      topics: ['Array', 'Two Pointers'],
      companies: ['Facebook', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 9200,
      dislikes: 1300
    },
    {
      id: 12,
      title: 'Search in Rotated Sorted Array',
      slug: 'search-in-rotated-sorted-array',
      difficulty: 'medium',
      acceptance: 42.3,
      topics: ['Array', 'Binary Search'],
      companies: ['Google', 'Amazon', 'Facebook', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 18100,
      dislikes: 1100
    },
    {
      id: 13,
      title: 'Find First and Last Position of Element',
      slug: 'find-first-and-last-position',
      difficulty: 'medium',
      acceptance: 44.8,
      topics: ['Array', 'Binary Search'],
      companies: ['Google', 'Amazon', 'LinkedIn'],
      solved: false,
      attempted: false,
      likes: 14200,
      dislikes: 470
    },
    {
      id: 14,
      title: 'Combination Sum',
      slug: 'combination-sum',
      difficulty: 'medium',
      acceptance: 73.5,
      topics: ['Array', 'Backtracking'],
      companies: ['Amazon', 'Apple', 'Airbnb'],
      solved: false,
      attempted: false,
      likes: 14800,
      dislikes: 310
    },
    {
      id: 15,
      title: 'Trapping Rain Water',
      slug: 'trapping-rain-water',
      difficulty: 'hard',
      acceptance: 61.0,
      topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
      companies: ['Amazon', 'Goldman Sachs', 'Google', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 25300,
      dislikes: 380
    },
    {
      id: 16,
      title: 'Permutations',
      slug: 'permutations',
      difficulty: 'medium',
      acceptance: 77.3,
      topics: ['Array', 'Backtracking'],
      companies: ['Microsoft', 'Amazon', 'LinkedIn'],
      solved: false,
      attempted: false,
      likes: 14700,
      dislikes: 260
    },
    {
      id: 17,
      title: 'Maximum Subarray',
      slug: 'maximum-subarray',
      difficulty: 'medium',
      acceptance: 50.8,
      topics: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
      companies: ['Amazon', 'Apple', 'Microsoft', 'LinkedIn'],
      solved: false,
      attempted: false,
      likes: 29100,
      dislikes: 1300
    },
    {
      id: 18,
      title: 'Spiral Matrix',
      slug: 'spiral-matrix',
      difficulty: 'medium',
      acceptance: 51.3,
      topics: ['Array', 'Matrix', 'Simulation'],
      companies: ['Microsoft', 'Amazon', 'Apple'],
      solved: false,
      attempted: false,
      likes: 11200,
      dislikes: 980
    },
    {
      id: 19,
      title: 'Jump Game',
      slug: 'jump-game',
      difficulty: 'medium',
      acceptance: 42.3,
      topics: ['Array', 'Dynamic Programming', 'Greedy'],
      companies: ['Amazon', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 15600,
      dislikes: 850
    },
    {
      id: 20,
      title: 'Merge Intervals',
      slug: 'merge-intervals',
      difficulty: 'medium',
      acceptance: 48.3,
      topics: ['Array', 'Sorting'],
      companies: ['Google', 'Amazon', 'Facebook', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 18400,
      dislikes: 680
    },
    {
      id: 21,
      title: 'Climbing Stairs',
      slug: 'climbing-stairs',
      difficulty: 'easy',
      acceptance: 53.7,
      topics: ['Math', 'Dynamic Programming', 'Memoization'],
      companies: ['Amazon', 'Adobe', 'Apple'],
      solved: false,
      attempted: false,
      likes: 17800,
      dislikes: 580
    },
    {
      id: 22,
      title: 'Sort Colors',
      slug: 'sort-colors',
      difficulty: 'medium',
      acceptance: 63.6,
      topics: ['Array', 'Two Pointers', 'Sorting'],
      companies: ['Microsoft', 'Amazon', 'Oracle'],
      solved: false,
      attempted: false,
      likes: 14300,
      dislikes: 530
    },
    {
      id: 23,
      title: 'Subsets',
      slug: 'subsets',
      difficulty: 'medium',
      acceptance: 77.3,
      topics: ['Array', 'Backtracking', 'Bit Manipulation'],
      companies: ['Amazon', 'Bloomberg', 'Uber'],
      solved: false,
      attempted: false,
      likes: 13500,
      dislikes: 210
    },
    {
      id: 24,
      title: 'Word Search',
      slug: 'word-search',
      difficulty: 'medium',
      acceptance: 44.0,
      topics: ['Array', 'Backtracking', 'Matrix'],
      companies: ['Amazon', 'Microsoft', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 12800,
      dislikes: 480
    },
    {
      id: 25,
      title: 'Best Time to Buy and Sell Stock',
      slug: 'best-time-to-buy-and-sell-stock',
      difficulty: 'easy',
      acceptance: 54.2,
      topics: ['Array', 'Dynamic Programming'],
      companies: ['Amazon', 'Google', 'Facebook', 'Goldman Sachs'],
      solved: false,
      attempted: false,
      likes: 24600,
      dislikes: 820
    },
    {
      id: 26,
      title: 'Binary Tree Inorder Traversal',
      slug: 'binary-tree-inorder-traversal',
      difficulty: 'easy',
      acceptance: 76.4,
      topics: ['Tree', 'Stack', 'DFS', 'Binary Tree'],
      companies: ['Microsoft', 'Amazon'],
      solved: false,
      attempted: false,
      likes: 11200,
      dislikes: 580
    },
    {
      id: 27,
      title: 'Validate Binary Search Tree',
      slug: 'validate-binary-search-tree',
      difficulty: 'medium',
      acceptance: 35.0,
      topics: ['Tree', 'DFS', 'Binary Search Tree', 'Binary Tree'],
      companies: ['Amazon', 'Facebook', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 13700,
      dislikes: 1300
    },
    {
      id: 28,
      title: 'Symmetric Tree',
      slug: 'symmetric-tree',
      difficulty: 'easy',
      acceptance: 56.2,
      topics: ['Tree', 'DFS', 'BFS', 'Binary Tree'],
      companies: ['Amazon', 'Microsoft', 'LinkedIn'],
      solved: false,
      attempted: false,
      likes: 12400,
      dislikes: 310
    },
    {
      id: 29,
      title: 'Binary Tree Level Order Traversal',
      slug: 'binary-tree-level-order-traversal',
      difficulty: 'medium',
      acceptance: 66.8,
      topics: ['Tree', 'BFS', 'Binary Tree'],
      companies: ['Amazon', 'Microsoft', 'Facebook'],
      solved: false,
      attempted: false,
      likes: 12100,
      dislikes: 240
    },
    {
      id: 30,
      title: 'Maximum Depth of Binary Tree',
      slug: 'maximum-depth-of-binary-tree',
      difficulty: 'easy',
      acceptance: 76.1,
      topics: ['Tree', 'DFS', 'BFS', 'Binary Tree'],
      companies: ['Amazon', 'LinkedIn', 'Google'],
      solved: false,
      attempted: false,
      likes: 10800,
      dislikes: 190
    },
    {
      id: 31,
      title: 'Construct Binary Tree from Preorder and Inorder',
      slug: 'construct-binary-tree-preorder-inorder',
      difficulty: 'medium',
      acceptance: 64.5,
      topics: ['Tree', 'Array', 'Hash Table', 'Divide and Conquer', 'Binary Tree'],
      companies: ['Amazon', 'Microsoft', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 11600,
      dislikes: 340
    },
    {
      id: 32,
      title: 'Flatten Binary Tree to Linked List',
      slug: 'flatten-binary-tree-to-linked-list',
      difficulty: 'medium',
      acceptance: 66.2,
      topics: ['Linked List', 'Tree', 'DFS', 'Stack', 'Binary Tree'],
      companies: ['Facebook', 'Amazon', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 10200,
      dislikes: 480
    },
    {
      id: 33,
      title: 'Single Number',
      slug: 'single-number',
      difficulty: 'easy',
      acceptance: 75.3,
      topics: ['Array', 'Bit Manipulation'],
      companies: ['Google', 'Amazon', 'Apple'],
      solved: false,
      attempted: false,
      likes: 13200,
      dislikes: 480
    },
    {
      id: 34,
      title: 'Linked List Cycle',
      slug: 'linked-list-cycle',
      difficulty: 'easy',
      acceptance: 51.3,
      topics: ['Linked List', 'Two Pointers', 'Hash Table'],
      companies: ['Amazon', 'Microsoft', 'Apple'],
      solved: false,
      attempted: false,
      likes: 12400,
      dislikes: 1200
    },
    {
      id: 35,
      title: 'LRU Cache',
      slug: 'lru-cache',
      difficulty: 'medium',
      acceptance: 43.0,
      topics: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'],
      companies: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 18800,
      dislikes: 780
    },
    {
      id: 36,
      title: 'Min Stack',
      slug: 'min-stack',
      difficulty: 'medium',
      acceptance: 55.1,
      topics: ['Stack', 'Design'],
      companies: ['Amazon', 'Bloomberg', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 11300,
      dislikes: 860
    },
    {
      id: 37,
      title: 'Intersection of Two Linked Lists',
      slug: 'intersection-of-two-linked-lists',
      difficulty: 'easy',
      acceptance: 58.7,
      topics: ['Linked List', 'Two Pointers', 'Hash Table'],
      companies: ['Amazon', 'Microsoft', 'LinkedIn'],
      solved: false,
      attempted: false,
      likes: 12100,
      dislikes: 1100
    },
    {
      id: 38,
      title: 'Majority Element',
      slug: 'majority-element',
      difficulty: 'easy',
      acceptance: 67.1,
      topics: ['Array', 'Hash Table', 'Divide and Conquer', 'Sorting'],
      companies: ['Amazon', 'Google', 'Zenefits'],
      solved: false,
      attempted: false,
      likes: 14700,
      dislikes: 460
    },
    {
      id: 39,
      title: 'House Robber',
      slug: 'house-robber',
      difficulty: 'medium',
      acceptance: 51.2,
      topics: ['Array', 'Dynamic Programming'],
      companies: ['Amazon', 'Google', 'Cisco'],
      solved: false,
      attempted: false,
      likes: 17500,
      dislikes: 350
    },
    {
      id: 40,
      title: 'Reverse Linked List',
      slug: 'reverse-linked-list',
      difficulty: 'easy',
      acceptance: 77.1,
      topics: ['Linked List', 'Recursion'],
      companies: ['Amazon', 'Microsoft', 'Apple', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 17000,
      dislikes: 310
    },
    {
      id: 41,
      title: 'Course Schedule',
      slug: 'course-schedule',
      difficulty: 'medium',
      acceptance: 48.4,
      topics: ['DFS', 'BFS', 'Graph', 'Topological Sort'],
      companies: ['Amazon', 'Microsoft', 'Uber'],
      solved: false,
      attempted: false,
      likes: 13100,
      dislikes: 530
    },
    {
      id: 42,
      title: 'Implement Trie (Prefix Tree)',
      slug: 'implement-trie-prefix-tree',
      difficulty: 'medium',
      acceptance: 66.8,
      topics: ['Hash Table', 'String', 'Design', 'Trie'],
      companies: ['Amazon', 'Google', 'Uber'],
      solved: false,
      attempted: false,
      likes: 10200,
      dislikes: 130
    },
    {
      id: 43,
      title: 'Kth Largest Element in an Array',
      slug: 'kth-largest-element-in-array',
      difficulty: 'medium',
      acceptance: 67.0,
      topics: ['Array', 'Divide and Conquer', 'Sorting', 'Heap'],
      companies: ['Facebook', 'Amazon', 'Microsoft', 'LinkedIn'],
      solved: false,
      attempted: false,
      likes: 14500,
      dislikes: 760
    },
    {
      id: 44,
      title: 'Invert Binary Tree',
      slug: 'invert-binary-tree',
      difficulty: 'easy',
      acceptance: 78.6,
      topics: ['Tree', 'DFS', 'BFS', 'Binary Tree'],
      companies: ['Google', 'Amazon'],
      solved: false,
      attempted: false,
      likes: 12000,
      dislikes: 180
    },
    {
      id: 45,
      title: 'Palindrome Linked List',
      slug: 'palindrome-linked-list',
      difficulty: 'easy',
      acceptance: 53.0,
      topics: ['Linked List', 'Two Pointers', 'Stack', 'Recursion'],
      companies: ['Facebook', 'Amazon', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 13100,
      dislikes: 850
    },
    {
      id: 46,
      title: 'Lowest Common Ancestor of BST',
      slug: 'lowest-common-ancestor-bst',
      difficulty: 'medium',
      acceptance: 66.8,
      topics: ['Tree', 'DFS', 'Binary Search Tree', 'Binary Tree'],
      companies: ['Amazon', 'Facebook', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 9800,
      dislikes: 290
    },
    {
      id: 47,
      title: 'Product of Array Except Self',
      slug: 'product-of-array-except-self',
      difficulty: 'medium',
      acceptance: 66.8,
      topics: ['Array', 'Prefix Sum'],
      companies: ['Amazon', 'Facebook', 'Apple', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 18700,
      dislikes: 1100
    },
    {
      id: 48,
      title: 'Move Zeroes',
      slug: 'move-zeroes',
      difficulty: 'easy',
      acceptance: 62.6,
      topics: ['Array', 'Two Pointers'],
      companies: ['Facebook', 'Amazon', 'Apple', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 13500,
      dislikes: 360
    },
    {
      id: 49,
      title: 'Find the Duplicate Number',
      slug: 'find-the-duplicate-number',
      difficulty: 'medium',
      acceptance: 62.9,
      topics: ['Array', 'Two Pointers', 'Binary Search', 'Bit Manipulation'],
      companies: ['Amazon', 'Google', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 19200,
      dislikes: 2800
    },
    {
      id: 50,
      title: 'Coin Change',
      slug: 'coin-change',
      difficulty: 'medium',
      acceptance: 44.7,
      topics: ['Array', 'Dynamic Programming', 'BFS'],
      companies: ['Amazon', 'Goldman Sachs', 'Google', 'Apple'],
      solved: false,
      attempted: false,
      likes: 16400,
      dislikes: 380
    },
    {
      id: 51,
      title: 'Number of Islands',
      slug: 'number-of-islands',
      difficulty: 'medium',
      acceptance: 58.6,
      topics: ['Array', 'DFS', 'BFS', 'Union Find', 'Matrix'],
      companies: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 19800,
      dislikes: 460
    },
    {
      id: 52,
      title: 'Daily Temperatures',
      slug: 'daily-temperatures',
      difficulty: 'medium',
      acceptance: 68.7,
      topics: ['Array', 'Stack', 'Monotonic Stack'],
      companies: ['Amazon', 'Facebook', 'Google'],
      solved: false,
      attempted: false,
      likes: 10900,
      dislikes: 250
    },
    {
      id: 53,
      title: 'Diameter of Binary Tree',
      slug: 'diameter-of-binary-tree',
      difficulty: 'easy',
      acceptance: 60.1,
      topics: ['Tree', 'DFS', 'Binary Tree'],
      companies: ['Facebook', 'Amazon', 'Google'],
      solved: false,
      attempted: false,
      likes: 11400,
      dislikes: 720
    },
    {
      id: 54,
      title: 'Subarray Sum Equals K',
      slug: 'subarray-sum-equals-k',
      difficulty: 'medium',
      acceptance: 44.2,
      topics: ['Array', 'Hash Table', 'Prefix Sum'],
      companies: ['Facebook', 'Amazon', 'Google'],
      solved: false,
      attempted: false,
      likes: 18600,
      dislikes: 580
    },
    {
      id: 55,
      title: 'Merge K Sorted Lists',
      slug: 'merge-k-sorted-lists',
      difficulty: 'hard',
      acceptance: 54.2,
      topics: ['Linked List', 'Divide and Conquer', 'Heap', 'Merge Sort'],
      companies: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber'],
      solved: false,
      attempted: false,
      likes: 16800,
      dislikes: 630
    },
    {
      id: 56,
      title: 'Task Scheduler',
      slug: 'task-scheduler',
      difficulty: 'medium',
      acceptance: 60.3,
      topics: ['Array', 'Hash Table', 'Greedy', 'Sorting', 'Heap'],
      companies: ['Facebook', 'Amazon', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 9100,
      dislikes: 1800
    },
    {
      id: 57,
      title: 'Palindromic Substrings',
      slug: 'palindromic-substrings',
      difficulty: 'medium',
      acceptance: 68.5,
      topics: ['String', 'Dynamic Programming'],
      companies: ['Facebook', 'Amazon', 'LinkedIn'],
      solved: false,
      attempted: false,
      likes: 9400,
      dislikes: 210
    },
    {
      id: 58,
      title: 'Longest Increasing Subsequence',
      slug: 'longest-increasing-subsequence',
      difficulty: 'medium',
      acceptance: 55.7,
      topics: ['Array', 'Binary Search', 'Dynamic Programming'],
      companies: ['Amazon', 'Microsoft', 'Google'],
      solved: false,
      attempted: false,
      likes: 17200,
      dislikes: 350
    },
    {
      id: 59,
      title: 'Word Break',
      slug: 'word-break',
      difficulty: 'medium',
      acceptance: 47.6,
      topics: ['Hash Table', 'String', 'Dynamic Programming', 'Trie', 'Memoization'],
      companies: ['Amazon', 'Google', 'Facebook', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 14800,
      dislikes: 640
    },
    {
      id: 60,
      title: 'Edit Distance',
      slug: 'edit-distance',
      difficulty: 'medium',
      acceptance: 57.3,
      topics: ['String', 'Dynamic Programming'],
      companies: ['Amazon', 'Google', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 12700,
      dislikes: 160
    },
    {
      id: 61,
      title: 'Rotate Image',
      slug: 'rotate-image',
      difficulty: 'medium',
      acceptance: 74.4,
      topics: ['Array', 'Math', 'Matrix'],
      companies: ['Amazon', 'Microsoft', 'Apple'],
      solved: false,
      attempted: false,
      likes: 14100,
      dislikes: 620
    },
    {
      id: 62,
      title: 'Group Anagrams',
      slug: 'group-anagrams',
      difficulty: 'medium',
      acceptance: 68.8,
      topics: ['Array', 'Hash Table', 'String', 'Sorting'],
      companies: ['Amazon', 'Google', 'Facebook', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 15300,
      dislikes: 470
    },
    {
      id: 63,
      title: 'Set Matrix Zeroes',
      slug: 'set-matrix-zeroes',
      difficulty: 'medium',
      acceptance: 55.9,
      topics: ['Array', 'Hash Table', 'Matrix'],
      companies: ['Amazon', 'Microsoft', 'Facebook'],
      solved: false,
      attempted: false,
      likes: 11600,
      dislikes: 580
    },
    {
      id: 64,
      title: 'Minimum Window Substring',
      slug: 'minimum-window-substring',
      difficulty: 'hard',
      acceptance: 43.3,
      topics: ['Hash Table', 'String', 'Sliding Window'],
      companies: ['Facebook', 'Amazon', 'Google', 'Uber', 'LinkedIn'],
      solved: false,
      attempted: false,
      likes: 14700,
      dislikes: 670
    },
    {
      id: 65,
      title: 'Decode Ways',
      slug: 'decode-ways',
      difficulty: 'medium',
      acceptance: 35.5,
      topics: ['String', 'Dynamic Programming'],
      companies: ['Facebook', 'Amazon', 'Microsoft', 'Uber'],
      solved: false,
      attempted: false,
      likes: 10100,
      dislikes: 4200
    },
    {
      id: 66,
      title: 'Unique Paths',
      slug: 'unique-paths',
      difficulty: 'medium',
      acceptance: 66.2,
      topics: ['Math', 'Dynamic Programming', 'Combinatorics'],
      companies: ['Google', 'Amazon', 'Facebook'],
      solved: false,
      attempted: false,
      likes: 14200,
      dislikes: 420
    },
    {
      id: 67,
      title: 'Letter Combinations of a Phone Number',
      slug: 'letter-combinations-of-phone-number',
      difficulty: 'medium',
      acceptance: 61.2,
      topics: ['Hash Table', 'String', 'Backtracking'],
      companies: ['Amazon', 'Google', 'Facebook', 'Uber'],
      solved: false,
      attempted: false,
      likes: 15300,
      dislikes: 910
    },
    {
      id: 68,
      title: 'Next Permutation',
      slug: 'next-permutation',
      difficulty: 'medium',
      acceptance: 40.3,
      topics: ['Array', 'Two Pointers'],
      companies: ['Google', 'Facebook', 'Amazon'],
      solved: false,
      attempted: false,
      likes: 14800,
      dislikes: 4100
    },
    {
      id: 69,
      title: 'Longest Valid Parentheses',
      slug: 'longest-valid-parentheses',
      difficulty: 'hard',
      acceptance: 35.4,
      topics: ['String', 'Dynamic Programming', 'Stack'],
      companies: ['Amazon', 'Google', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 10300,
      dislikes: 360
    },
    {
      id: 70,
      title: 'Serialize and Deserialize Binary Tree',
      slug: 'serialize-and-deserialize-binary-tree',
      difficulty: 'hard',
      acceptance: 57.4,
      topics: ['String', 'Tree', 'DFS', 'BFS', 'Design', 'Binary Tree'],
      companies: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber'],
      solved: false,
      attempted: false,
      likes: 9200,
      dislikes: 340
    },
    {
      id: 71,
      title: 'Word Ladder',
      slug: 'word-ladder',
      difficulty: 'hard',
      acceptance: 40.4,
      topics: ['Hash Table', 'String', 'BFS'],
      companies: ['Amazon', 'Google', 'Facebook', 'Bloomberg'],
      solved: false,
      attempted: false,
      likes: 11200,
      dislikes: 1800
    },
    {
      id: 72,
      title: 'N-Queens',
      slug: 'n-queens',
      difficulty: 'hard',
      acceptance: 68.8,
      topics: ['Array', 'Backtracking'],
      companies: ['Amazon', 'Google', 'Apple'],
      solved: false,
      attempted: false,
      likes: 10100,
      dislikes: 230
    },
    {
      id: 73,
      title: 'Sudoku Solver',
      slug: 'sudoku-solver',
      difficulty: 'hard',
      acceptance: 61.9,
      topics: ['Array', 'Hash Table', 'Backtracking', 'Matrix'],
      companies: ['Amazon', 'Google', 'Microsoft'],
      solved: false,
      attempted: false,
      likes: 8200,
      dislikes: 220
    },
    {
      id: 74,
      title: 'Palindrome Number',
      slug: 'palindrome-number',
      difficulty: 'easy',
      acceptance: 60.2,
      topics: ['Math'],
      companies: ['Google', 'Uber'],
      solved: false,
      attempted: false,
      likes: 7800,
      dislikes: 2100
    },
    {
      id: 75,
      title: 'Longest Common Prefix',
      slug: 'longest-common-prefix',
      difficulty: 'easy',
      acceptance: 47.0,
      topics: ['String', 'Trie'],
      companies: ['Facebook'],
      solved: false,
      attempted: false,
      likes: 11200,
      dislikes: 3600
    }
  ];

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await api.get(API_ENDPOINTS.v2.dsa);
      // setProblems(response.data);
      
      // Using sample data — load instantly
      setProblems(sampleProblems);
      setTotalCount(sampleProblems.length);
      setSolvedCount(sampleProblems.filter(p => p.solved).length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setProblems(sampleProblems);
      setTotalCount(sampleProblems.length);
      setSolvedCount(0);
      setLoading(false);
    }
  };

  const filteredProblems = useMemo(() => problems.filter(problem => {
    // Search filter
    if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Topic filter
    if (selectedTopic !== 'all' && !problem.topics.some(t => t.toLowerCase().includes(selectedTopic.toLowerCase()))) {
      return false;
    }
    // Difficulty filter
    if (selectedDifficulty !== 'all' && problem.difficulty !== selectedDifficulty) {
      return false;
    }
    // Status filter
    if (selectedStatus === 'solved' && !problem.solved) {
      return false;
    }
    if (selectedStatus === 'attempted' && !problem.attempted) {
      return false;
    }
    if (selectedStatus === 'todo' && (problem.solved || problem.attempted)) {
      return false;
    }
    return true;
  }), [problems, searchQuery, selectedTopic, selectedDifficulty, selectedStatus]);

  // Sort problems
  const sortedProblems = useMemo(() => [...filteredProblems].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'id') {
      comparison = a.id - b.id;
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'difficulty') {
      const order = { easy: 1, medium: 2, hard: 3 };
      comparison = order[a.difficulty] - order[b.difficulty];
    } else if (sortBy === 'acceptance') {
      comparison = b.acceptance - a.acceptance;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  }), [filteredProblems, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getDifficultyColor = (difficulty) => {
    return DSA_DIFFICULTY[difficulty] || DSA_DIFFICULTY.medium;
  };

  const totalPages = Math.ceil(sortedProblems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProblems = sortedProblems.slice(startIndex, endIndex);

  const handlePickRandom = () => {
    const randomIndex = Math.floor(Math.random() * filteredProblems.length);
    const randomProblem = filteredProblems[randomIndex];
    if (randomProblem) {
      navigate(`/dsa/${randomProblem.slug}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200">
      {/* Home Navigation */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-sm font-medium group-hover:text-white">Home</span>
          </Link>
          <div className="ml-3 h-5 w-px bg-gray-700"></div>
          <span className="ml-3 text-sm text-gray-500">DSA Problem Set</span>
        </div>
      </div>

      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-blue-900/20 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Icon name="trophy" className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                  Problem Set
                </h1>
              </div>
              <p className="text-gray-400 text-lg flex items-center gap-2">
                <Icon name="fire" className="w-5 h-5 text-orange-500" />
                Master Data Structures & Algorithms
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center px-6 py-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
                <div className="text-3xl font-bold text-green-400">{solvedCount}</div>
                <div className="text-xs text-gray-400 font-medium">Solved</div>
              </div>
              <div className="text-center px-6 py-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
                <div className="text-3xl font-bold text-yellow-400">{problems.filter(p => p.attempted).length}</div>
                <div className="text-xs text-gray-400 font-medium">Attempted</div>
              </div>
              <div className="text-center px-6 py-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
                <div className="text-3xl font-bold text-blue-400">{totalCount}</div>
                <div className="text-xs text-gray-400 font-medium">Total</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="text-white font-semibold">{((solvedCount / totalCount) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500 shadow-lg shadow-green-500/30"
                style={{ width: `${(solvedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePickRandom}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-500/40"
            >
              <Icon name="random" className="w-5 h-5" />
              Pick One
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                showFilters 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              <Icon name="filter" className="w-5 h-5" />
              Filters
            </button>
            <button className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold flex items-center gap-2 transition-all border border-gray-700">
              <Icon name="list" className="w-5 h-5" />
              Lists
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters Section */}
        {showFilters && (
          <div className="mb-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Difficulty</label>
                <div className="flex flex-col gap-2">
                  {['all', 'easy', 'medium', 'hard'].map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-4 py-2 rounded-lg text-left font-medium transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Status</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'all', label: 'All', icon: '📋' },
                    { id: 'solved', label: 'Solved', icon: '✓' },
                    { id: 'attempted', label: 'Attempted', icon: '🔄' },
                    { id: 'todo', label: 'Todo', icon: '○' }
                  ].map(status => (
                    <button
                      key={status.id}
                      onClick={() => setSelectedStatus(status.id)}
                      className={`px-4 py-2 rounded-lg text-left font-medium transition-all flex items-center gap-2 ${
                        selectedStatus === status.id
                          ? 'bg-green-600 text-white shadow-md shadow-green-600/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span>{status.icon}</span>
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Topic</label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  <button
                    onClick={() => setSelectedTopic('all')}
                    className={`px-4 py-2 rounded-lg text-left font-medium transition-all ${
                      selectedTopic === 'all'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    All Topics
                  </button>
                  {['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 
                    'Greedy', 'Depth-First Search', 'Binary Search', 'Two Pointers', 'Sliding Window',
                    'Linked List', 'Stack', 'Tree', 'Graph'].map(topic => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic.toLowerCase())}
                      className={`px-4 py-2 rounded-lg text-left font-medium transition-all ${
                        selectedTopic === topic.toLowerCase()
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSelectedDifficulty('all');
                  setSelectedStatus('all');
                  setSelectedTopic('all');
                  setSearchQuery('');
                }}
                className="px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-all border border-red-600/30"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Icon name="search" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search problems by title, topic, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="id">ID</option>
              <option value="title">Title</option>
              <option value="difficulty">Difficulty</option>
              <option value="acceptance">Acceptance</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Showing <span className="text-white font-semibold">{currentProblems.length}</span> of <span className="text-white font-semibold">{sortedProblems.length}</span> problems
          </span>
          {(selectedDifficulty !== 'all' || selectedStatus !== 'all' || selectedTopic !== 'all' || searchQuery) && (
            <span className="text-blue-400">
              {sortedProblems.length} filtered results
            </span>
          )}
        </div>

        {/* Problems Table */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-900/80 border-b border-gray-800 text-gray-400 text-sm font-bold uppercase tracking-wide">
            <div className="col-span-1 flex items-center gap-2">
              <span>Status</span>
            </div>
            <div 
              className="col-span-5 cursor-pointer hover:text-white transition-colors flex items-center gap-2"
              onClick={() => handleSort('title')}
            >
              <span>Title</span>
              {sortBy === 'title' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
            <div 
              className="col-span-2 cursor-pointer hover:text-white transition-colors text-center flex items-center justify-center gap-2"
              onClick={() => handleSort('difficulty')}
            >
              <span>Difficulty</span>
              {sortBy === 'difficulty' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
            <div 
              className="col-span-2 cursor-pointer hover:text-white transition-colors text-center flex items-center justify-center gap-2"
              onClick={() => handleSort('acceptance')}
            >
              <span>Acceptance</span>
              {sortBy === 'acceptance' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
            <div className="col-span-2 text-center">
              <span>Frequency</span>
            </div>
          </div>

          {/* Problems List */}
          <div className="divide-y divide-gray-800">
            {currentProblems.map((problem, index) => {
              const diffColor = getDifficultyColor(problem.difficulty);
              const totalLikes = problem.likes + problem.dislikes;
              const likePercentage = totalLikes > 0 ? ((problem.likes / totalLikes) * 100).toFixed(0) : 0;
              
              return (
                <Link
                  key={problem.id}
                  to={`/dsa/${problem.slug}`}
                  className="group block px-6 py-4 hover:bg-gray-800/50 transition-all duration-200"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Status */}
                    <div className="col-span-12 lg:col-span-1 flex items-center gap-3 lg:block">
                      {problem.solved ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                            <Icon name="check" className="w-4 h-4" />
                          </div>
                          <span className="text-sm lg:hidden">Solved</span>
                        </div>
                      ) : problem.attempted ? (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                            <span className="text-xs">•</span>
                          </div>
                          <span className="text-sm lg:hidden">Attempted</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-700/30 flex items-center justify-center border border-gray-700">
                          <span className="text-xs text-gray-600">○</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="col-span-12 lg:col-span-5">
                      <div className="flex items-start gap-3">
                        <span className="text-gray-500 font-mono text-sm min-w-[2rem]">{problem.id}.</span>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-base mb-1 group-hover:text-blue-400 transition-colors ${
                            problem.solved ? 'text-gray-400' : 'text-white'
                          }`}>
                            {problem.title}
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {problem.topics.slice(0, 3).map((topic, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-800/80 text-gray-400 rounded text-xs font-medium border border-gray-700/50"
                              >
                                {topic}
                              </span>
                            ))}
                            {problem.topics.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-800/80 text-gray-500 rounded text-xs">
                                +{problem.topics.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="col-span-4 lg:col-span-2 flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${diffColor.bg} ${diffColor.color} border ${diffColor.border || 'border-transparent'}`}>
                        {diffColor.label}
                      </span>
                    </div>

                    {/* Acceptance */}
                    <div className="col-span-4 lg:col-span-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-base font-bold ${
                          problem.acceptance >= 50 ? 'text-green-400' : 
                          problem.acceptance >= 30 ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {problem.acceptance.toFixed(1)}%
                        </span>
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              problem.acceptance >= 50 ? 'bg-green-500' : 
                              problem.acceptance >= 30 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${problem.acceptance}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Frequency/Likes */}
                    <div className="col-span-4 lg:col-span-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1">
                          <Icon name="star" className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-semibold text-gray-300">{likePercentage}%</span>
                        </div>
                        <span className="text-xs text-gray-600">({(problem.likes / 1000).toFixed(1)}k)</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {sortedProblems.length === 0 && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No problems found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDifficulty('all');
                setSelectedStatus('all');
                setSelectedTopic('all');
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-600/30"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {sortedProblems.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-900 border border-gray-800 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold"
              >
                ← Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 py-2 text-gray-600">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-900 border border-gray-800 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold"
              >
                Next →
              </button>
            </nav>
          </div>
        )}

        {/* Custom Scrollbar Styles */}
        <style>{`
          .custom-scrollbar {
            scroll-behavior: smooth;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          /* Smooth problem row transitions */
          .group {
            will-change: background-color;
            transform: translateZ(0);
          }
          /* Smooth page scroll */
          html {
            scroll-behavior: smooth;
          }
        `}</style>
      </div>
    </div>
  );
};

export default DSAProblems;
