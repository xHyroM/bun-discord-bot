import { PartialChannel, GuildTextChannel } from "@lilybird/transformers";
import { ApplicationCommand } from "lilybird";
import { Tag } from "../structs/Tag.ts";
import { readFileSync } from "node:fs";
import { safeSlice } from "../util.ts";
import matter from "gray-matter";
import { join } from "node:path";
import { Glob } from "bun";

type PartialGuildTextChannel = PartialChannel<GuildTextChannel>;

const TAGS_PATH = join(import.meta.dir, "..", "..", "data", "tags");
const tags = Array.from(new Glob("*.md").scanSync(TAGS_PATH));

export const TAGS: Tag[] = [];

for (const tag of tags) {
  const content = readFileSync(join(TAGS_PATH, tag));
  const frontMatter = matter(content);

  TAGS.push({
    name: frontMatter.data.name,
    question: frontMatter.data.question,
    keywords: frontMatter.data.keywords,
    answer: frontMatter.content,
    category_ids: frontMatter.data.category_ids ?? null,
    channel_ids: frontMatter.data.channel_ids ?? null,
  });
}

function getAvailableTags(channel: PartialGuildTextChannel) {
  return TAGS.filter((t) => {
    const channelIds = t.channel_ids;
    const categoryIds = t.category_ids;

    if (!channelIds && !categoryIds) return true;
    if (channelIds && channelIds.includes(channel?.id ?? "")) return true;
    if (
      categoryIds &&
      channel?.parentId &&
      categoryIds.includes(channel.parentId)
    )
      return true;

    return false;
  });
}

export function getTags(
  channel: PartialGuildTextChannel,
  length: number,
): Array<ApplicationCommand.Option.ChoiceStructure> {
  const availableTags = getAvailableTags(channel);
  return safeSlice<Array<ApplicationCommand.Option.ChoiceStructure>>(
    availableTags.map((tag) => ({
      name: `🚀 ${tag.question}`,
      value: tag.question,
    })),
    length,
  );
}

export function searchTag<T extends boolean>(
  channel: PartialGuildTextChannel,
  providedQuery: string,
  multiple?: T,
): T extends true ? Array<ApplicationCommand.Option.ChoiceStructure> : Tag {
  const availableTags = getAvailableTags(channel);
  const query = providedQuery?.toLowerCase()?.replace(/-/g, " ");

  if (!multiple) {
    const exactKeyword = availableTags.find((tag) =>
      tag.keywords.find((k) => k.toLowerCase() === query),
    );
    const keywordMatch = availableTags.find((tag) =>
      tag.keywords.find((k) => k.toLowerCase().includes(query)),
    );
    const questionMatch = availableTags.find((tag) =>
      tag.question.toLowerCase().includes(query),
    );
    const answerMatch = availableTags.find((tag) =>
      tag.answer.toLowerCase().includes(query),
    );

    const tag = exactKeyword ?? questionMatch ?? keywordMatch ?? answerMatch;
    return tag as T extends true
      ? Array<ApplicationCommand.Option.ChoiceStructure>
      : Tag;
  }

  const exactKeywords: Array<ApplicationCommand.Option.ChoiceStructure> = [];
  const keywordMatches: Array<ApplicationCommand.Option.ChoiceStructure> = [];
  const questionMatches: Array<ApplicationCommand.Option.ChoiceStructure> = [];
  const answerMatches: Array<ApplicationCommand.Option.ChoiceStructure> = [];

  for (const tag of availableTags) {
    const exactKeyword = tag.keywords.find((t) => t.toLowerCase() === query);
    const includesKeyword = tag.keywords.find((t) =>
      t.toLowerCase().includes(query),
    );
    const questionMatch = tag.question.toLowerCase().includes(query);
    const answerMatch = tag.answer.toLowerCase().includes(query);

    if (exactKeyword) {
      exactKeywords.push({
        name: `✅ ${tag.question}`,
        value: tag.question,
      });
    } else if (includesKeyword) {
      keywordMatches.push({
        name: `🔑 ${tag.question}`,
        value: tag.question,
      });
    } else if (questionMatch) {
      questionMatches.push({
        name: `❓ ${tag.question}`,
        value: tag.question,
      });
    } else if (answerMatch) {
      answerMatches.push({
        name: `📄 ${tag.question}`,
        value: tag.question,
      });
    }
  }

  const tags = [
    ...exactKeywords,
    ...questionMatches,
    ...keywordMatches,
    ...answerMatches,
  ];
  return tags as T extends true
    ? Array<ApplicationCommand.Option.ChoiceStructure>
    : Tag;
}
