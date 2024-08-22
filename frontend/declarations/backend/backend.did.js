export const idlFactory = ({ IDL }) => {
  const CategoryId = IDL.Text;
  const TopicId = IDL.Text;
  const ReplyId = IDL.Text;
  const Category = IDL.Record({
    'id' : CategoryId,
    'icon' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
  });
  const Time = IDL.Int;
  const Reply = IDL.Record({
    'id' : ReplyId,
    'content' : IDL.Text,
    'createdAt' : Time,
    'parentReplyId' : IDL.Opt(ReplyId),
    'topicId' : TopicId,
  });
  const Topic = IDL.Record({
    'id' : TopicId,
    'categoryId' : CategoryId,
    'title' : IDL.Text,
    'content' : IDL.Text,
    'createdAt' : Time,
  });
  return IDL.Service({
    'createCategory' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [CategoryId],
        [],
      ),
    'createReply' : IDL.Func(
        [TopicId, IDL.Text, IDL.Opt(ReplyId)],
        [ReplyId],
        [],
      ),
    'createTopic' : IDL.Func([CategoryId, IDL.Text, IDL.Text], [TopicId], []),
    'ensureDefaultCategories' : IDL.Func([], [], []),
    'getCategories' : IDL.Func([], [IDL.Vec(Category)], ['query']),
    'getReplies' : IDL.Func([TopicId], [IDL.Vec(Reply)], ['query']),
    'getTopics' : IDL.Func([CategoryId], [IDL.Vec(Topic)], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
