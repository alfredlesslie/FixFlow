/**
 * Helper to fetch emails and extract verification links from Mailpit
 */
export async function getLatestVerificationLink(recipientEmail: string, timeoutMs = 15000): Promise<string> {
  const startTime = Date.now();
  const searchEmail = recipientEmail.toLowerCase().trim();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:8025/api/v1/messages`);
      if (res.ok) {
        const data = await res.json();
        const messages = data.messages || [];

        // Find message directed to recipient
        const match = messages.find((m: any) =>
          m.To && m.To.some((to: any) => to.Address.toLowerCase() === searchEmail)
        );

        if (match) {
          // Fetch message detail
          const detailRes = await fetch(`http://localhost:8025/api/v1/message/${match.ID}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const body = detail.HTML || detail.Text || '';

            // Match verification link
            const urlMatch = body.match(/href="([^"]*\/verify-email\?token=[^"]*)"/) ||
                             body.match(/(https?:\/\/[^\s<"']+\/verify-email\?token=[^\s<"']+)/) ||
                             body.match(/\/verify-email\?token=([a-zA-Z0-9_\-]+)/);

            if (urlMatch) {
              const rawUrl = urlMatch[1] || urlMatch[0];
              // Convert to relative or absolute path
              if (rawUrl.startsWith('http')) {
                const parsed = new URL(rawUrl);
                return parsed.pathname + parsed.search;
              }
              return rawUrl;
            }
          }
        }
      }
    } catch (err) {
      // Retry until timeout
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Timed out waiting for verification email for ${recipientEmail} in Mailpit`);
}
