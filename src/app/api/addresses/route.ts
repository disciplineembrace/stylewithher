import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await db.address.findMany({
      where: { userId: payload.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Addresses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = body

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json({ error: 'fullName, phone, addressLine1, city, state, and pincode are required' }, { status: 400 })
    }

    if (isDefault) {
      await db.address.updateMany({
        where: { userId: payload.userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await db.address.create({
      data: {
        userId: payload.userId,
        label,
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country: country || 'India',
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    console.error('Addresses POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { addressId, label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = body

    if (!addressId) {
      return NextResponse.json({ error: 'addressId is required' }, { status: 400 })
    }

    const existing = await db.address.findFirst({
      where: { id: addressId, userId: payload.userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    if (isDefault) {
      await db.address.updateMany({
        where: { userId: payload.userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await db.address.update({
      where: { id: addressId },
      data: {
        ...(label !== undefined && { label }),
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(addressLine1 !== undefined && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(country !== undefined && { country }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Addresses PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('addressId')

    if (!addressId) {
      return NextResponse.json({ error: 'addressId query parameter is required' }, { status: 400 })
    }

    const existing = await db.address.findFirst({
      where: { id: addressId, userId: payload.userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    await db.address.delete({ where: { id: addressId } })
    return NextResponse.json({ message: 'Address deleted successfully' })
  } catch (error) {
    console.error('Addresses DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
