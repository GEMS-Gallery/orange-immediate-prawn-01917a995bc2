import Bool "mo:base/Bool";
import Hash "mo:base/Hash";

import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor {
  // Types
  type CategoryId = Text;
  type TopicId = Text;
  type ReplyId = Text;

  type Category = {
    id: CategoryId;
    name: Text;
    description: Text;
  };

  type Topic = {
    id: TopicId;
    categoryId: CategoryId;
    title: Text;
    content: Text;
    createdAt: Time.Time;
  };

  type Reply = {
    id: ReplyId;
    topicId: TopicId;
    content: Text;
    parentReplyId: ?ReplyId;
    createdAt: Time.Time;
  };

  // Stable storage
  stable var nextCategoryId: Nat = 0;
  stable var nextTopicId: Nat = 0;
  stable var nextReplyId: Nat = 0;

  stable var categoriesEntries: [(CategoryId, Category)] = [];
  stable var topicsEntries: [(TopicId, Topic)] = [];
  stable var repliesEntries: [(ReplyId, Reply)] = [];

  // In-memory storage
  var categories = HashMap.HashMap<CategoryId, Category>(10, Text.equal, Text.hash);
  var topics = HashMap.HashMap<TopicId, Topic>(100, Text.equal, Text.hash);
  var replies = HashMap.HashMap<ReplyId, Reply>(1000, Text.equal, Text.hash);

  // Initialize data
  public func initializeDefaultCategories() : async () {
    let defaultCategories = [
      { id = generateId("category"); name = "Web Hacking"; description = "Discuss web application vulnerabilities and exploitation techniques." },
      { id = generateId("category"); name = "Network Security"; description = "Explore network security concepts and tools." },
      { id = generateId("category"); name = "Cryptography"; description = "Dive into encryption algorithms and cryptographic protocols." },
    ];
    for (category in defaultCategories.vals()) {
      categories.put(category.id, category);
    };
  };

  // Helper functions
  func generateId(prefix: Text) : Text {
    let id = switch prefix {
      case "category" { nextCategoryId += 1; nextCategoryId };
      case "topic" { nextTopicId += 1; nextTopicId };
      case "reply" { nextReplyId += 1; nextReplyId };
      case _ { 0 };
    };
    prefix # "-" # Nat.toText(id)
  };

  // Public functions
  public query func getCategories() : async [Category] {
    Iter.toArray(categories.vals())
  };

  public shared func createCategory(name: Text, description: Text) : async CategoryId {
    let id = generateId("category");
    let category: Category = {
      id = id;
      name = name;
      description = description;
    };
    categories.put(id, category);
    id
  };

  public query func getTopics(categoryId: CategoryId) : async [Topic] {
    Iter.toArray(topics.vals())
      |> Array.filter(_, func (t: Topic) : Bool { t.categoryId == categoryId })
  };

  public shared func createTopic(categoryId: CategoryId, title: Text, content: Text) : async TopicId {
    let id = generateId("topic");
    let topic: Topic = {
      id = id;
      categoryId = categoryId;
      title = title;
      content = content;
      createdAt = Time.now();
    };
    topics.put(id, topic);
    id
  };

  public query func getReplies(topicId: TopicId) : async [Reply] {
    Iter.toArray(replies.vals())
      |> Array.filter(_, func (r: Reply) : Bool { r.topicId == topicId })
  };

  public shared func createReply(topicId: TopicId, content: Text, parentReplyId: ?ReplyId) : async ReplyId {
    let id = generateId("reply");
    let reply: Reply = {
      id = id;
      topicId = topicId;
      content = content;
      parentReplyId = parentReplyId;
      createdAt = Time.now();
    };
    replies.put(id, reply);
    id
  };

  // System functions
  system func preupgrade() {
    categoriesEntries := Iter.toArray(categories.entries());
    topicsEntries := Iter.toArray(topics.entries());
    repliesEntries := Iter.toArray(replies.entries());
  };

  system func postupgrade() {
    categoriesEntries := [];
    topicsEntries := [];
    repliesEntries := [];
  };
}
