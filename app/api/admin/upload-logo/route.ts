// app/api/admin/upload-logo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('logo') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No logo file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only PNG, JPG, JPEG, and SVG files are allowed.'
      }, { status: 400 })
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 2MB.'
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'assets', 'images')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate filename based on file type
    const extension = file.type === 'image/svg+xml' ? 'svg' :
                     file.type === 'image/jpeg' ? 'jpg' :
                     file.type === 'image/png' ? 'png' : 'jpg'

    const filename = `logo.${extension}`
    const filepath = path.join(uploadDir, filename)

    // Write file
    await writeFile(filepath, buffer)

    return NextResponse.json({
      success: true,
      message: 'Logo uploaded successfully',
      filename,
      path: `/assets/images/${filename}`
    })

  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}