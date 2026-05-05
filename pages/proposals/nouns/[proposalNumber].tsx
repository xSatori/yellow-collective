import Layout from "@/components/Layout";
import {
  getNounsDaoProposals,
  type NounsDaoProposal,
} from "data/nouns-dao/proposals";
import type {
  GetStaticPaths,
  GetStaticPropsResult,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type NounsProposalDetailProps = {
  proposal: NounsDaoProposal;
};

const formatDate = (timestamp: string) =>
  new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const getStatus = (state: number) => {
  switch (state) {
    case 0:
      return "Pending";
    case 1:
      return "Active";
    case 2:
      return "Cancelled";
    case 3:
      return "Defeated";
    case 4:
      return "Succeeded";
    case 5:
      return "Queued";
    case 6:
      return "Expired";
    case 7:
      return "Executed";
    case 8:
      return "Vetoed";
    default:
      return "Unknown";
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const proposals = await getNounsDaoProposals();

    return {
      paths: proposals.map((proposal) => ({
        params: { proposalNumber: String(proposal.proposalNumber) },
      })),
      fallback: "blocking",
    };
  } catch {
    return {
      paths: [],
      fallback: "blocking",
    };
  }
};

export const getStaticProps = async ({
  params,
}: {
  params?: { proposalNumber?: string };
}): Promise<GetStaticPropsResult<NounsProposalDetailProps>> => {
  try {
    const proposals = await getNounsDaoProposals();
    const proposal = proposals.find(
      (item) => String(item.proposalNumber) === params?.proposalNumber
    );

    if (!proposal) return { notFound: true, revalidate: 60 };

    return {
      props: { proposal },
      revalidate: 60,
    };
  } catch (error) {
    console.warn("Unable to load Nouns DAO proposal detail", error);
    return { notFound: true, revalidate: 60 };
  }
};

export default function NounsProposalDetailPage({
  proposal,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>
          Nouns Proposal {proposal.proposalNumber} | Yellow Collective
        </title>
      </Head>

      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-6 pb-12">
        <Link
          href="/proposals/nouns"
          className="w-fit font-heading text-lg text-secondary transition hover:text-skin-base"
        >
          Back to Nouns DAO proposals
        </Link>

        <section className="rounded-2xl border border-skin-stroke bg-skin-muted p-6 shadow-sm md:p-8">
          <div className="caption font-semibold text-secondary">
            Nouns DAO Proposal {proposal.proposalNumber} /{" "}
            {formatDate(proposal.timeCreated)} / {getStatus(proposal.state)}
          </div>
          <h1 className="mt-4 text-[34px] leading-none md:text-[42px]">
            {proposal.title}
          </h1>
        </section>

        <section className="rounded-2xl border border-skin-stroke bg-skin-muted p-6 shadow-sm md:p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-skin max-w-none prose-headings:font-heading prose-h1:text-3xl prose-h2:text-2xl prose-p:text-base prose-p:leading-snug prose-a:text-accent-blue prose-a:underline md:prose-p:text-lg"
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {proposal.description}
          </ReactMarkdown>
        </section>
      </div>
    </Layout>
  );
}
