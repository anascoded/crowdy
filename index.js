// index.js
// 1. THIS RUNS BEFORE ANY EXPO CODE LOADS
import './polyfills';

// 2. Now let Expo Router boot up safely with a polyfill engine
import "expo-router/entry";