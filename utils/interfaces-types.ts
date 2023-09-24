export type LayoutProps = {
  children: React.ReactNode;
};

export type Demand = {
  id: bigint;
  author: `0x${string}`;
  winner: `0x${string}`;
  description: string;
  formatsAccepted: string[];
  reward: bigint;
  isDone: boolean;
  creationDate: bigint;
  expirationDate: bigint;
  filesCount: bigint;
  winnerFile: bigint;
};

export type CardProps = {
  demand: Demand;
};

export type RequestFile = {
  fileName: string;
  format: string;
  cid: string;
};

export type ParticipantFile = {
  author: `0x${string}`;
  cid: string;
  creationDate: bigint;
  description: string;
  fileName: string;
  format: string;
  id: bigint;
};
