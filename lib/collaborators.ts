import { clerkClient } from "@clerk/nextjs/server";

export interface EnrichedCollaborator {
  email: string;
  name: string | null;
  imageUrl: string | null;
}

export async function enrichCollaboratorsWithClerk(
  emails: string[],
): Promise<EnrichedCollaborator[]> {
  if (emails.length === 0) return [];

  let client;
  try {
    client = await clerkClient();
  } catch (error) {
    console.error("Failed to initialize Clerk client", { error });
    return emails.map((email) => ({ email, name: null, imageUrl: null }));
  }

  let users;
  try {
    const result = await client.users.getUserList({ emailAddress: emails });
    users = result.data;
  } catch (error) {
    console.error("Failed to enrich collaborators from Clerk", {
      emails,
      error,
    });
    return emails.map((email) => ({ email, name: null, imageUrl: null }));
  }

  const byEmail = new Map<
    string,
    { name: string | null; imageUrl: string | null }
  >();

  for (const user of users) {
    const fullName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const name = fullName.length > 0 ? fullName : null;
    const imageUrl = user.imageUrl ?? null;
    for (const address of user.emailAddresses) {
      byEmail.set(address.emailAddress.toLowerCase(), { name, imageUrl });
    }
  }

  return emails.map((email) => {
    const enriched = byEmail.get(email.toLowerCase());
    return {
      email,
      name: enriched?.name ?? null,
      imageUrl: enriched?.imageUrl ?? null,
    };
  });
}
