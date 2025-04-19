import { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAppStore } from "@/store";
import { BottomNav } from "@/components/bottom-nav";
import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { cn } from "@/lib/utils";
import { apiService } from "@/utils/apiService";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { calculateRealmStatus } from "@/lib/realm";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

let messageIdCounter = 0;
const generateMessageId = () => `msg_${++messageIdCounter}`;

const AppPage: NextPage = () => {
  const router = useRouter();
  const {
    realm,
    selectedDog,
    userName,
    updateRealmStatus,
    setSelectedDog,
    setGuardianAngel,
  } = useAppStore();
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const account = useCurrentAccount();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const savingsPercentage = Math.round(
    (realm.savingsAchieved / realm.savingsGoal) * 100,
  );

  useEffect(() => {
    const fetchUserAndPetData = async () => {
      if (!account) {
        console.log("No wallet account found, skipping data fetch");
        setIsDataLoading(false);
        return;
      }

      if (account) {
        try {
          setIsDataLoading(true);

          const userResponse = await apiService.user.getUser(account.address);
          const userData = userResponse.data;

          if (userData) {
            console.log("User data:", userData);

            const savingsGoal = parseFloat(userData.savingsGoal);
            console.log("Savings goal ($):", savingsGoal);

            try {
              const petResponse = await apiService.pet.getActivePetByUserId(
                userData.id,
              );
              const petData = petResponse.data;

              if (petData) {
                console.log("Active pet data:", petData);

                const savingsAchieved =
                  parseFloat(petData.balance) / 1000000000;
                console.log("Raw balance from DB:", petData.balance);
                console.log("Converted savings achieved ($):", savingsAchieved);
                console.log(
                  "Calculated percentage:",
                  (savingsAchieved / savingsGoal) * 100,
                );

                // Calculate realm status
                const realmStatus = calculateRealmStatus(
                  savingsAchieved,
                  savingsGoal,
                );

                // Update realm status in store
                updateRealmStatus({
                  savingsGoal,
                  savingsAchieved,
                  status: realmStatus,
                });

                // Update selected dog in store with accurate data
                setSelectedDog({
                  id: petData.id,
                  breed: petData.breed.toLowerCase(),
                  name: petData.name,
                  image: `/dogs/${petData.breed.toLowerCase()}.png`,
                  walletAddress: petData.walletAddress,
                });
              }
            } catch (petError) {
              console.error("Failed to fetch active pet data:", petError);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        } finally {
          setIsDataLoading(false);
        }
      }
    };

    fetchUserAndPetData();
  }, [account, updateRealmStatus, setSelectedDog]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize chat with welcome message when chat becomes active
  useEffect(() => {
    const fetchChatMessages = async () => {
      if (account) {
        const response = await apiService.ai.getChatHistory(account?.address);
        const data = response.data;
        const history = data.history;
        const processedHistory = history.map(
          (his: { role: "assistant" | "user"; content: string }) => ({
            id: generateMessageId(),
            content: his.content,
            isUser: his.role === "user",
          }),
        );
        if (processedHistory.length === 0) {
          setMessages([
            {
              id: generateMessageId(),
              content: `Woof woof! Hi ${userName}! How are ya?`,
              isUser: false,
            },
          ]);
        } else {
          setMessages([...processedHistory]);
        }
        // console.log("CHAT HIST: ", response.data)
        isInitializedRef.current = true;
      }
    };
    fetchChatMessages();
    // if (isChatActive && messages.length === 0 && !isInitializedRef.current) {
    //   isInitializedRef.current = true;
    //   setMessages([
    //     {
    //       id: generateMessageId(),
    //       content: `Woof woof! Hi ${userName}! How are ya?`,
    //       isUser: false,
    //     },
    //   ]);
    // }
  }, [isChatActive, messages.length, userName, account]);

  const handleSendMessage = async (content: string) => {
    if (!account) {
      console.error("No account connected");
      return;
    }
    // Add user message immediately
    const userMessage: Message = {
      id: generateMessageId(),
      content,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate API delay
      // await new Promise((resolve) => setTimeout(resolve, 1500));
      // TODO: Replace with actual API call
      // const response = await fetch("/api/chat", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     message: content,
      //     dogName: selectedDog?.name,
      //   }),
      // });

      const response = await apiService.ai.chat(account?.address, {
        message: content,
      });
      const data = response.data;

      // Add dog's response
      const dogResponse: Message = {
        id: generateMessageId(),
        content: data.message,
        isUser: false,
      };
      setMessages((prev) => [...prev, dogResponse]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[url('/backgrounds/bg-primary.png')] bg-cover bg-center font-patrick-hand text-[#392E1F] relative">
      <div className="flex flex-col h-screen">
        {/* Main App View - Always Visible */}
        <div className="flex flex-col p-4">
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            {/* Realm Status - Left */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                <Image
                  src={`/icons/realm.png`}
                  alt="Realm Icon"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-base leading-tight">Realm Status</p>
                <p className="text-lg font-medium leading-tight">
                  {isDataLoading ? "Loading..." : realm.status}
                </p>
              </div>
            </div>

            {/* Hearts - Right */}
            <div className="flex gap-1 h-full items-center justify-center">
              {Array.from({ length: realm.maxHearts }).map((_, i) => (
                <Image
                  key={i}
                  src={
                    i < realm.activeHearts
                      ? "/icons/heart_filled.png"
                      : "/icons/heart_empty.png"
                  }
                  alt="Heart"
                  width={20}
                  height={20}
                />
              ))}
            </div>
          </div>

          {/* Savings Goal */}
          <div className="mt-8 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-1">
              <p className="text-base">Savings Goal</p>
              <p className="text-base">
                {isDataLoading
                  ? "Loading..."
                  : `$${realm.savingsGoal.toLocaleString()}`}
              </p>
            </div>
            <div className="h-3 w-full rounded-full bg-[#392E1F]/20 overflow-hidden border-2 border-[#392E1F]">
              <div
                className="h-full bg-[#4CAF50] transition-all"
                style={{
                  width: `${isDataLoading ? 0 : savingsPercentage}%`,
                }}
              />
            </div>
            <p className="text-sm mt-1 text-center">
              {isDataLoading
                ? "Loading..."
                : `${savingsPercentage}% of goal achieved`}
            </p>
          </div>

          {/* Camera Button */}
          <div
            className="absolute right-6 top-48 cursor-pointer"
            onClick={() => router.push("/share")}
          >
            <Image
              src="/icons/camera.png"
              alt="Camera"
              width={32}
              height={32}
            />
          </div>

          {/* Pet Display */}
          <div
            className={cn(
              "flex-1 flex flex-col items-center justify-end transform",
              isChatActive ? "translate-y-8" : "translate-y-56",
            )}
          >
            {isChatActive ? (
              <></>
            ) : (
              <p className="my-2 text-2xl">
                {isDataLoading ? "Loading..." : selectedDog?.name || "Luna"}
              </p>
            )}
            <div className="relative w-48 h-48">
              {isDataLoading ? (
                <p className="text-center">Loading pet...</p>
              ) : (
                <Image
                  src={selectedDog?.image || "/dogs/pom.png"}
                  alt={selectedDog?.name || "Guardian Angel"}
                  fill
                  className="object-contain"
                />
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface - Overlaid when active */}
        {isChatActive && (
          <div className="absolute bottom-24 left-0 right-0 bg-[#FFE9B9] border-2 border-[#392E1F] backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-[45vh]">
            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className="h-[calc(45vh-80px)] overflow-y-auto p-4 space-y-4"
            >
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message.content}
                  isUser={message.isUser}
                  senderName={
                    !message.isUser ? selectedDog?.name || "Luna" : undefined
                  }
                />
              ))}
              {isTyping && (
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden relative">
                    <Image
                      src={selectedDog?.image || "/dogs/pom.png"}
                      alt={selectedDog?.name || "Guardian Angel"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="bg-[#FFE9B9] text-[#392E1F] rounded-2xl px-4 py-2 rounded-bl-none">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-[#392E1F] rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-[#392E1F] rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-[#392E1F] rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#FFE9B9] border-[#392E1F] border-t">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <BottomNav
          currentPath={router.pathname}
          onChatClick={() => setIsChatActive(!isChatActive)}
        />
      </div>
    </div>
  );
};

export default AppPage;
