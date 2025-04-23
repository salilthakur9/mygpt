import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";

export async function POST(req) {
    const wh = new Webhook(process.env.SIGNING_SECRET);

    const headerPayload = headers();
    const svixHeaders = {
        "svix-id": headerPayload.get("svix-id"),
        "svix-timestamp": headerPayload.get("svix-timestamp"),
        "svix-signature": headerPayload.get("svix-signature"),
    };

    const payload = await req.json();
    const body = JSON.stringify(payload);

    let data, type;

    try {
        const evt = wh.verify(body, svixHeaders);
        data = evt.data;
        type = evt.type;
    } catch (err) {
        console.error("❌ Webhook verification failed:", err);
        return new Response("Unauthorized", { status: 401 });
    }

    const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        image: data.image_url,
    };

    try {
        await connectDB();

        switch (type) {
            case 'user.created':
                await User.create(userData);
                break;

            case 'user.updated':
                await User.findByIdAndUpdate(data.id, userData);
                break;

            case 'user.deleted':
                await User.findByIdAndDelete(data.id);
                break;

            default:
                console.log(`📭 Unhandled webhook type: ${type}`);
        }

        return new Response(JSON.stringify({ message: "Event Received!" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("🚨 Error processing webhook:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
