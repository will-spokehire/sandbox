#!/usr/bin/env tsx

/**
 * Check Upload Status Script
 * Shows statistics about uploaded images and their status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUploadStatus() {
  console.log('📊 Checking Upload Status...\n');
  
  try {
    // Total images
    const totalImages = await prisma.media.count({
      where: { type: 'IMAGE' }
    });
    
    // Images by status
    const statusStats = await prisma.media.groupBy({
      by: ['status'],
      where: { type: 'IMAGE' },
      _count: { status: true }
    });
    
    // Images with published URL
    const withPublishedUrl = await prisma.media.count({
      where: { 
        type: 'IMAGE',
        publishedUrl: { not: null }
      }
    });
    
    // Images without published URL
    const withoutPublishedUrl = await prisma.media.count({
      where: { 
        type: 'IMAGE',
        publishedUrl: null
      }
    });
    
    // Images marked as READY
    const readyImages = await prisma.media.count({
      where: { 
        type: 'IMAGE',
        status: 'READY'
      }
    });
    
    // Images with published URL AND READY status
    const uploadedAndReady = await prisma.media.count({
      where: { 
        type: 'IMAGE',
        status: 'READY',
        publishedUrl: { not: null }
      }
    });
    
    // Print results
    console.log('📈 Overall Statistics:');
    console.log(`  Total images: ${totalImages}`);
    console.log(`  With published URL: ${withPublishedUrl}`);
    console.log(`  Without published URL: ${withoutPublishedUrl}`);
    console.log(`  Uploaded & READY: ${uploadedAndReady}`);
    
    console.log('\n📊 Status Breakdown:');
    statusStats.forEach(stat => {
      const percentage = ((stat._count.status / totalImages) * 100).toFixed(1);
      console.log(`  ${stat.status}: ${stat._count.status} (${percentage}%)`);
    });
    
    console.log('\n🔍 Upload Progress:');
    const uploadPercentage = ((withPublishedUrl / totalImages) * 100).toFixed(1);
    const readyPercentage = ((uploadedAndReady / totalImages) * 100).toFixed(1);
    
    console.log(`  Uploaded to Supabase: ${uploadPercentage}%`);
    console.log(`  Uploaded & Ready: ${readyPercentage}%`);
    
    // Sample of uploaded images
    console.log('\n📋 Sample Uploaded Images (first 5):');
    const sampleUploaded = await prisma.media.findMany({
      where: { 
        type: 'IMAGE',
        publishedUrl: { not: null }
      },
      select: {
        id: true,
        filename: true,
        publishedUrl: true,
        status: true,
        fileSize: true,
      },
      take: 5,
    });
    
    sampleUploaded.forEach((img, index) => {
      const sizeMB = img.fileSize ? (Number(img.fileSize) / (1024 * 1024)).toFixed(2) : 'unknown';
      console.log(`  ${index + 1}. ${img.filename}`);
      console.log(`     Status: ${img.status} | Size: ${sizeMB}MB`);
      console.log(`     URL: ${img.publishedUrl?.substring(0, 60)}...`);
    });
    
    // Sample of NOT uploaded images
    if (withoutPublishedUrl > 0) {
      console.log('\n⚠️  Sample NOT Uploaded Images (first 5):');
      const sampleNotUploaded = await prisma.media.findMany({
        where: { 
          type: 'IMAGE',
          publishedUrl: null
        },
        select: {
          id: true,
          filename: true,
          status: true,
          originalUrl: true,
        },
        take: 5,
      });
      
      sampleNotUploaded.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.filename} (Status: ${img.status})`);
      });
    }
    
    // Summary and recommendations
    console.log('\n💡 Recommendations:');
    if (withoutPublishedUrl > 0) {
      console.log(`  ⚠️  ${withoutPublishedUrl} images still need to be uploaded`);
      console.log('     Run: npm run upload-images-to-supabase');
    } else {
      console.log('  ✅ All images have been uploaded to Supabase!');
    }
    
    if (uploadedAndReady < withPublishedUrl) {
      const needReady = withPublishedUrl - uploadedAndReady;
      console.log(`  ⚠️  ${needReady} uploaded images are not marked as READY`);
      console.log('     They may have been uploaded before the status update was added');
      console.log('     Re-run upload script with OVERWRITE_EXISTING: true to fix');
    }
    
  } catch (error) {
    console.error('❌ Error checking upload status:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkUploadStatus();

