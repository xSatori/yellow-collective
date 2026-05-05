import Layout from "@/components/Layout";
import {
  getNounsDaoProposals,
  type NounsDaoProposal,
} from "data/nouns-dao/proposals";
import type { GetStaticPropsResult, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";

type NounsProposalsPageProps = {
  proposals: Omit<NounsDaoProposal, "description">[];
  latestBlock: number;
};

const getTimestamp = (value: string) => Number(value || 0);

const formatDate = (timestamp: string) => {
  const value = getTimestamp(timestamp);
  if (!value) return "";

  return new Date(value * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const getDaysFromTimestamp = (timestamp: string) => {
  const value = getTimestamp(timestamp);
  if (!value) return "";

  const diff = Date.now() - value * 1000;
  const days = Math.max(1, Math.round(diff / 86400000));
  return days === 1 ? "1 day ago" : `${days} days ago`;
};

const getStatus = (state: number) => {
  switch (state) {
    case 0:
      return {
        label: "Pending",
        className: "border-yellow-200 text-yellow-600",
      };
    case 1:
      return {
        label: "Active",
        className: "border-emerald-200 text-emerald-600",
      };
    case 2:
      return {
        label: "Cancelled",
        className: "border-skin-stroke text-secondary",
      };
    case 3:
      return { label: "Defeated", className: "border-red-200 text-red-600" };
    case 4:
      return {
        label: "Succeeded",
        className: "border-emerald-200 text-emerald-600",
      };
    case 5:
      return {
        label: "Queued",
        className: "border-purple-200 text-purple-500",
      };
    case 6:
      return {
        label: "Expired",
        className: "border-skin-stroke text-secondary",
      };
    case 7:
      return {
        label: "Executed",
        className: "border-blue-100 text-accent-blue",
      };
    case 8:
      return { label: "Vetoed", className: "border-red-200 text-red-600" };
    default:
      return {
        label: "Unknown",
        className: "border-skin-stroke text-secondary",
      };
  }
};

export const getStaticProps = async (): Promise<
  GetStaticPropsResult<NounsProposalsPageProps>
> => {
  try {
    const proposals = await getNounsDaoProposals();

    return {
      props: {
        proposals: proposals.map(({ description, ...proposal }) => proposal),
        latestBlock: 0,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.warn("Unable to load Nouns DAO proposals", error);

    return {
      props: {
        proposals: [],
        latestBlock: 0,
      },
      revalidate: 60,
    };
  }
};

export default function NounsProposalsPage({
  proposals,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>Nouns DAO Proposals | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 pb-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            <h1 className="text-[36px] leading-none md:text-[44px]">
              Proposals
            </h1>
            <div className="flex rounded-2xl border border-skin-stroke bg-skin-muted p-1 shadow-sm">
              <Link
                href="/proposals"
                className="rounded-xl px-4 py-2 font-heading text-base text-secondary transition hover:bg-[#fff7bf] hover:text-skin-base"
              >
                Yellow Collective
              </Link>
              <Link
                href="/proposals/nouns"
                className="rounded-xl bg-[#fff7bf] px-4 py-2 font-heading text-base text-skin-base"
              >
                Nouns DAO
              </Link>
            </div>
          </div>

          <p className="max-w-[420px] text-base leading-snug text-secondary">
            Nouns DAO proposals for Yellow Collective meta-governance.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {proposals.length > 0 ? (
            proposals.map((proposal) => (
              <ProposalRow key={proposal.proposalId} proposal={proposal} />
            ))
          ) : (
            <div className="rounded-2xl border border-skin-stroke bg-skin-muted p-8 text-base text-secondary md:text-lg">
              No Nouns DAO proposals found.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const ProposalRow = ({
  proposal,
}: {
  proposal: Omit<NounsDaoProposal, "description">;
}) => {
  const status = getStatus(proposal.state);

  return (
    <Link
      href={`/proposals/nouns/${proposal.proposalNumber}`}
      className="grid min-h-[96px] grid-cols-[44px_1fr] items-center gap-4 rounded-2xl border border-skin-stroke bg-skin-muted p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-md md:grid-cols-[64px_1fr_auto]"
    >
      <div className="font-heading text-2xl text-secondary">
        {proposal.proposalNumber}
      </div>

      <div className="min-w-0">
        <h2 className="truncate font-heading text-2xl leading-none text-skin-base md:text-3xl">
          {proposal.title}
        </h2>
        <div className="mt-3 text-base text-secondary md:text-lg">
          {formatDate(proposal.timeCreated)}
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-start gap-5 md:col-span-1 md:justify-end">
        <div className="hidden text-base text-secondary sm:block md:text-lg">
          {getDaysFromTimestamp(proposal.timeCreated)}
        </div>
        <div
          className={`rounded-full border bg-skin-muted px-4 py-2 font-heading text-base md:text-lg ${status.className}`}
        >
          {status.label}
        </div>
      </div>
    </Link>
  );
};
