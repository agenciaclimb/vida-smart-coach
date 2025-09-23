import React from "react";

async function createCheckout(priceId: string, userId: string) {
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId,
      userId,
      successUrl: `${window.location.origin}/billing/success`,
      cancelUrl: `${window.location.origin}/billing/cancel`
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message ?? "Falha ao iniciar checkout");
  }

  const { url } = (await response.json()) as { url: string };
  if (url) {
    window.location.href = url;
  }
}

interface UpgradeButtonProps {
  priceId: string;
  userId: string;
  label?: string;
}

export default function UpgradeButton({ priceId, userId, label = "Assinar Premium" }: UpgradeButtonProps) {
  const handleClick = async () => {
    try {
      await createCheckout(priceId, userId);
    } catch (error) {
      console.error(error);
      alert("Não foi possível iniciar o checkout agora. Tente novamente mais tarde.");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
    >
      {label}
    </button>
  );
}
