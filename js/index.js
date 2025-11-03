//// ---- CART ---- ////

// - Read cart from local storage - //
const CART_KEY = "museumCartV1";

function readCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

// - Write cart to local storage - //
function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// - Add an item to the cart - //
function addToCart(button) {
    const id = button.dataset.id;
    const name = button.dataset.name;
    const price = parseInt(button.dataset.price);
    const image = button.dataset.image;

    const cart = readCart();
    const existingItem = cart.find((item) => item.id === id);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ id, name, price, image, qty: 1 });
    }

    writeCart(cart);
    console.log(`Added to cart: ${name}`);

    const itemCard = button.closest(".shop-item");
    const badge = itemCard?.querySelector(".qty-badge");
    const thisItem = cart.find((i) => i.id === id);

    if (badge && thisItem) {
        badge.textContent = `Qty: ${thisItem.qty}`;
    }
}

// - Update all quantity badges on shop items - //
function updateAllBadges() {
    const cart = readCart();
    document.querySelectorAll(".shop-item").forEach((item) => {
        const id = item.dataset.id;
        const badge = item.querySelector(".qty-badge");
        const cartItem = cart.find((i) => i.id === id);

        badge.textContent = `Qty: ${cartItem ? cartItem.qty : 0}`;
    });
}

//// ---- CURRENCY HANDLING ---- ////

let currentCurrency = "JPY"; // default

// - Format number as currency string - //
function money(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currentCurrency,
        maximumFractionDigits: currentCurrency === "JPY" ? 0 : 2
    }).format(amount);
}

// - Convert a price (JPY) to the active currency - //
function convertPrice(priceJPY) {
    const JPY_TO_USD = 0.0065;
    if (currentCurrency === "USD") {
        return priceJPY * JPY_TO_USD;
    } else {
        return priceJPY;
    }
}

// - Update visible prices on shop page - //
function updateShopPrices() {
    const els = document.querySelectorAll(".price");
    if (!els.length) return;

    els.forEach((el) => {
        const jpy = Number(el.dataset.price);
        if (Number.isNaN(jpy)) {
            el.textContent = "";
            return;
        }
        const converted = convertPrice(jpy);
        el.textContent = money(converted);
    });
}

// - Setup currency toggle buttons (JPY / USD) - //
function setupCurrencyToggle() {
    const buttons = Array.from(document.querySelectorAll(".currency-btn"));
    if (!buttons.length) return;

    const activeBtn = buttons.find((b) => b.classList.contains("active"));
    if (activeBtn) currentCurrency = activeBtn.dataset.currency;

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (btn.classList.contains("active")) return;

            currentCurrency = btn.dataset.currency;

            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            if (document.querySelector(".shop-item")) updateShopPrices();
            if (document.getElementById("summary")) render();
        });
    });
}

//// ---- CART PAGE CONSTANTS ---- ////

const TAX_RATE = 0.102;
const MEMBER_DISCOUNT_RATE = 0.15;
const SHIPPING_RATE = 25.0;
const VOLUME_TIERS = [
    [0.0, 49.99, 0.0],
    [50.0, 99.99, 0.05],
    [100.0, 199.99, 0.1],
    [200.0, Infinity, 0.15]
];

// - Return the volume discount rate based on total - //
function volumeRate(total) {
    for (const [min, max, rate] of VOLUME_TIERS) {
        if (total >= min && total <= max) return rate;
    }
    return 0;
}

//// ---- CART ITEM OPERATIONS ---- ////

// - Remove one unit of an item from the cart - //
function removeItem(id) {
    const cart = readCart();
    const item = cart.find((it) => it.id === id);

    if (item) {
        if (item.qty > 1) {
            item.qty -= 1;
        } else {
            const index = cart.indexOf(item);
            cart.splice(index, 1);
        }
    }

    writeCart(cart);
    render();
}

// - Clear entire cart and reset member toggle - //
function clearCart() {
    localStorage.removeItem(CART_KEY);
    const memberToggle = document.getElementById("memberToggle");
    if (memberToggle) memberToggle.checked = false;
    render();
    console.log("Cart cleared.");
}

//// ---- CART PAGE RENDERING ---- ////

// - Render cart items and totals - //
function render() {
    const pathname=window.location.pathname;
    if (!pathname.endsWith("/cart.html")) {
        return
    }
    
    const itemsDiv = document.getElementById("items");
    const summaryPre = document.getElementById("summary");
    const emptyMsg = document.getElementById("emptyMsg");
    const memberToggle = document.getElementById("memberToggle");
    const isMember = memberToggle?.checked ?? false;

    let cart = readCart().filter((it) => it.qty > 0 && it.price > 0);

    // - Empty cart message - //
    if (cart.length === 0) {
        itemsDiv.hidden = true;
        summaryPre.hidden = true;
        emptyMsg.hidden = false;
        emptyMsg.textContent = "Your cart is empty.";
        return;
    }

    // - Build item list - //
    itemsDiv.innerHTML = "";
    itemsDiv.hidden = false;
    emptyMsg.hidden = true;

    let itemTotal = 0;

    for (const item of cart) {
        const convertedPrice = convertPrice(item.price);
        const lineTotal = convertedPrice * item.qty;
        itemTotal += lineTotal;

        const line = document.createElement("div");
        line.style.display = "flex";
        line.style.justifyContent = "space-between";
        line.style.alignItems = "center";
        line.style.marginBottom = "4px";

        const nameText = document.createElement("span");
        nameText.textContent = `${item.qty} × ${item.name}`;
        line.appendChild(nameText);

        // -- Add and Remove Buttons -- //
        const btnContainer = document.createElement("span");

        // Add Button
        const addBtn = document.createElement("button");
        addBtn.textContent = "Add item";
        addBtn.style.marginLeft = "10px";
        addBtn.onclick = () => {
            const cart = readCart();
            const existingItem = cart.find((it) => it.id === item.id);
            if (existingItem) {
                existingItem.qty += 1;
                writeCart(cart);
                render();
            }
        };
        btnContainer.appendChild(addBtn);

        // Remove Button
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove item";
        removeBtn.style.marginLeft = "5px";
        removeBtn.onclick = () => removeItem(item.id);
        btnContainer.appendChild(removeBtn);

        line.appendChild(btnContainer);


        const priceText = document.createElement("span");
        priceText.textContent = money(lineTotal);
        line.appendChild(priceText);

        itemsDiv.appendChild(line);
    }

    // - Calculate totals and discounts - //
    const USD_TO_JPY = 1 / 0.0065;
    const volumeDiscRate = volumeRate(itemTotal);
    let volumeDisc = 0;
    let memberDisc = 0;

    if (isMember && volumeDiscRate > 0) {
        const choice = prompt("Only one discount may be applied. Type 'M' for Member or 'V' for Volume:") || "";
        if (choice.toUpperCase() === "M") {
            memberDisc = itemTotal * MEMBER_DISCOUNT_RATE;
        } else {
            volumeDisc = itemTotal * volumeDiscRate;
        }
    } else if (isMember) {
        memberDisc = itemTotal * MEMBER_DISCOUNT_RATE;
    } else if (volumeDiscRate > 0) {
        volumeDisc = itemTotal * volumeDiscRate;
    }

    const shipping = currentCurrency === "USD" ? 25.0 : 25.0 * USD_TO_JPY;
    const subtotal = itemTotal - volumeDisc - memberDisc + shipping;
    const taxAmount = subtotal * TAX_RATE;
    const invoiceTotal = subtotal + taxAmount;

    // - Display summary - //
    summaryPre.hidden = false;
    summaryPre.textContent = `Hello Shopper, here is your Cart Summary.

Subtotal of Items:   ${money(itemTotal)}
Volume Discount:     ${money(-volumeDisc)}
Member Discount:     ${money(-memberDisc)}
Shipping:            ${money(shipping)}
Subtotal (Taxable):  ${money(subtotal)}
Tax Rate:            ${(TAX_RATE * 100).toFixed(2)}%
Tax Amount:          ${money(taxAmount)}

----------------------------------------
Cart Total:          ${money(invoiceTotal)}`;
}

//// ---- PAGE INITIALIZATION ---- ////

document.addEventListener("DOMContentLoaded", () => {
    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearCart);
    }

    const memberToggle = document.getElementById("memberToggle");
    if (memberToggle) {
        memberToggle.addEventListener("change", render);
    }
});

// - Initialize currency UI and page state - //
(function initCurrencyUI() {
    setupCurrencyToggle();
    if (document.querySelector(".shop-item")) {
        updateShopPrices();
        updateAllBadges();
    }
    if (document.getElementById("summary")) {
        render();
    }
})();

//// ---- MODALS ---- ////

// - Open image modal (shop page) - //
function openModal(imgElement) {
    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modal-image");
    modalImage.src = imgElement.src;
    modalImage.alt = imgElement.alt;
    modal.style.display = "block";
}

// - Open text modal (collections page) - //
function openModalText(imgElement) {
    const describedId = imgElement.getAttribute("aria-describedby");
    const describedElement = document.getElementById(describedId);
    const modal = document.getElementById("modal");
    const modalText = document.getElementById("modal-text");
    modalText.innerHTML = describedElement.innerHTML;
    modal.style.display = "block";
}

// - Close modal - //
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

// - Close modal when clicking outside - //
window.onclick = function (event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
        closeModal();
    }
};
