'use client';

import React from 'react';
import { PDFLibrary } from '@/components/pdf';

/**
 * PDF知识库页面
 */
export default function PDFPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">PDF知识库</h1>
      <PDFLibrary />
    </div>
  );
} 