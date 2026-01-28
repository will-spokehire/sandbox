import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout as PayloadRootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './(payload)/admin/importMap.js'
import './(payload)/custom.scss'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

export const metadata = {
  title: 'SpokeHire CMS',
  description: 'PayloadCMS Admin Panel for SpokeHire',
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

// Use Payload's RootLayout as the root layout to avoid nested html/body tags
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PayloadRootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </PayloadRootLayout>
  )
}

