async function main(): Promise<void> {
  console.info("Seed placeholder: no records inserted for the repository-foundation stage.");
}

main().catch((error: unknown) => {
  console.error("Seeding failed.", error);
  process.exitCode = 1;
});
