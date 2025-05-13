"use client";

import { useLayoutEffect, useEffect } from 'react';

// Hook này sẽ sử dụng useLayoutEffect trên client và useEffect trên server
// Giúp tránh cảnh báo khi sử dụng useLayoutEffect trong SSR
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect; 