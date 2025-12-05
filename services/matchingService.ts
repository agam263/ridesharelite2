import { RideRequest, MatchCandidate } from '../types';
import { MOCK_DRIVERS, MOCK_PASSENGERS } from '../constants';

// Simulates the algorithm described in PRD Section 4: "Real-Time Ride Matching"
// 1. Route Overlap Score
// 2. Time Window Match (10-15 mins)
// 3. Distance Proximity

export const findMatchesForRide = async (request: RideRequest): Promise<MatchCandidate[]> => {
  // Simulate API Network Delay and Algo Processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  let potentialMatches: MatchCandidate[] = [];

  // If I am a RIDER, I look for DRIVERS
  if (request.role === 'RIDER') {
    potentialMatches = MOCK_DRIVERS;
  } 
  // If I am a DRIVER, I look for PASSENGERS (RIDERS)
  else {
    potentialMatches = MOCK_PASSENGERS;
  }

  // Add some randomness to simulate "Real-time" dynamic matching logic based on the requested route
  return potentialMatches.map(match => {
    // Modify score slightly based on the "Request" to make it feel dynamic
    const dynamicScore = Math.min(99, Math.max(60, match.matchScore + (Math.random() * 10 - 5)));
    return {
      ...match,
      matchScore: Math.round(dynamicScore)
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
};