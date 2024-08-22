import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Category {
  'id' : CategoryId,
  'icon' : string,
  'name' : string,
  'description' : string,
}
export type CategoryId = string;
export interface Reply {
  'id' : ReplyId,
  'content' : string,
  'createdAt' : Time,
  'parentReplyId' : [] | [ReplyId],
  'topicId' : TopicId,
}
export type ReplyId = string;
export type Time = bigint;
export interface Topic {
  'id' : TopicId,
  'categoryId' : CategoryId,
  'title' : string,
  'content' : string,
  'createdAt' : Time,
}
export type TopicId = string;
export interface _SERVICE {
  'createCategory' : ActorMethod<[string, string, string], CategoryId>,
  'createReply' : ActorMethod<[TopicId, string, [] | [ReplyId]], ReplyId>,
  'createTopic' : ActorMethod<[CategoryId, string, string], TopicId>,
  'ensureDefaultCategories' : ActorMethod<[], undefined>,
  'getCategories' : ActorMethod<[], Array<Category>>,
  'getReplies' : ActorMethod<[TopicId], Array<Reply>>,
  'getTopics' : ActorMethod<[CategoryId], Array<Topic>>,
  'healthCheck' : ActorMethod<[], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
