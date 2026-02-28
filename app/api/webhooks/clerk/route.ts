// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  // 1. Get the headers
  const headerPayload = headers();
  const svix_id = (await headerPayload).get("svix-id");
  const svix_timestamp = (await headerPayload).get("svix-timestamp");
  const svix_signature = (await headerPayload).get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // 2. Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // 3. Create a new Svix instance with your secret.
  const webhookSecret = process.env.WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('WEBHOOK_SECRET environment variable is not set')
    return new Response('Webhook configuration error', {
      status: 500
    })
  }

  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // 4. Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  // 5. Handle the event
  const eventType = evt.type;
  
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0].email_address;

    try {
        // 👇 FIXED: Use firstName and lastName instead of 'name'
        await prisma.user.create({
            data: {
                clerkId: id,
                email: email,
                firstName: first_name, 
                lastName: last_name,
                role: 'TEACHER' // Default role
            }
        })
        console.log(`User ${id} created in DB`)
    } catch (error) {
        console.log("Error creating user in DB:", error)
    }
  }

  return new Response('', { status: 200 })
}