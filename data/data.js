const chats = [
    {
      isGroupChat: false,
      users: [
        {
          name: "John Doe",
          email: "john@example.com",
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
        },
      ],
      _id: "617a077e18c25468bc7c4dd4",
      chatName: "John Doe",
    },
    {
      isGroupChat: false,
      users: [
        {
          name: "Demo User",
          email: "demo@example.com",
        },
        {
          name: "Test User",
          email: "test@example.com",
        },
      ],
      _id: "617a077e18c25468b27c4dd4",
      chatName: "Demo User",
    },
    {
      isGroupChat: false,
      users: [
        {
          name: "Demo User",
          email: "demo@example.com",
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
        },
      ],
      _id: "617a077e18c2d468bc7c4dd4",
      chatName: "Anthony",
    },
    {
      isGroupChat: true,
      users: [
        {
          name: "John Doe",
          email: "john@example.com",
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
        },
        {
          name: "Demo User",
          email: "demo@example.com",
        },
      ],
      _id: "617a518c4081150716472c78",
      chatName: "Friends",
      groupAdmin: {
        name: "Demo User",
        email: "demo@example.com",
      },
    },
    {
      isGroupChat: false,
      users: [
        {
          name: "Alice Johnson",
          email: "alice@example.com",
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
        },
      ],
      _id: "617a077e18c25468bc7cfdd4",
      chatName: "Alice Johnson",
    },
    {
      isGroupChat: true,
      users: [
        {
          name: "John Doe",
          email: "john@example.com",
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
        },
        {
          name: "Demo User",
          email: "demo@example.com",
        },
      ],
      _id: "617a518c4081150016472c78",
      chatName: "Chill Zone",
      groupAdmin: {
        name: "Demo User",
        email: "demo@example.com",
      },
    },
  ];

  module.exports = {chats}