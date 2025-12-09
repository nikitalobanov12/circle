import PusherClient from 'pusher-js';

// Client-side Pusher instance (singleton)
// Uses NEXT_PUBLIC_ prefixed env vars for client-side access

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
	if (!pusherClient) {
		pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
			cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
		});
	}
	return pusherClient;
}

export default getPusherClient;
