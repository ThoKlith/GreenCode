import _ from "lodash";
import moment from "moment";

type User = { id: string; name: string };

declare const prisma: {
  orders: {
    findMany: (args: unknown) => Promise<unknown>;
  };
};

declare const openai: {
  chat: {
    completions: {
      create: (args: unknown) => Promise<unknown>;
    };
  };
};

export async function runInefficientFlow(users: User[]) {
  // BAD: query DB dentro loop (pattern N+1)
  for (const user of users) {
    await prisma.orders.findMany({ where: { userId: user.id } });
  }

  // BAD: chiamate AI ripetute + temperature alta
  for (const user of users) {
    await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 1.2,
      messages: [{ role: "user", content: `Scrivi un riassunto per ${user.name}` }],
    });
  }
}

export function BadList({ users }: { users: User[] }) {
  // BAD: map con JSX senza key
  return (
    <section>
      {users.map((u) => (
        <article>
          <h3>{u.name}</h3>
          <p>{moment().format("YYYY-MM-DD")}</p>
          <small>{_.kebabCase(u.name)}</small>
        </article>
      ))}
    </section>
  );
}
