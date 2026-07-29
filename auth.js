(() => {
  const client = window.supabaseClient;
  const page = window.location.pathname.split("/").pop() || "index.html";
  const money = amount => `UGX ${Number(amount || 0).toLocaleString()}`;
  const safeText = value => value ?? "";

  const message = (text, type = "error", target = "#form-message") => {
    const el = document.querySelector(target);
    if (!el) return;
    el.textContent = text;
    el.className = `message ${type}`;
  };

  const configured = () => {
    if (client) return true;
    message("Connect Supabase first: add your project URL and publishable key in supabase-config.js.");
    return false;
  };

  const logout = async () => {
    if (client) await client.auth.signOut();
    window.location.href = "index.html";
  };
  document.querySelector("#logout-button")?.addEventListener("click", logout);

  const registerForm = document.querySelector("#register-form");
  if (registerForm) registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!configured()) return;
    if (!registerForm.checkValidity()) { registerForm.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(registerForm));
    if (data.password !== data.confirmPassword) { message("The passwords do not match."); return; }
    const submit = registerForm.querySelector("button[type=submit]");
    submit.disabled = true; submit.textContent = "Creating account...";
    const { data: result, error } = await client.auth.signUp({
      email: data.email.trim(), password: data.password,
      options: { data: { full_name: data.name.trim(), phone: data.phone.trim() } }
    });
    submit.disabled = false; submit.textContent = "Create account";
    if (error) { message(error.message); return; }
    if (!result.session) { message("Account created. Check your email to confirm it, then log in.", "success"); registerForm.reset(); return; }
    window.location.href = "dashboard.html";
  });

  const loginForm = document.querySelector("#login-form");
  if (loginForm) loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!configured()) return;
    if (!loginForm.checkValidity()) { loginForm.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(loginForm));
    const submit = loginForm.querySelector("button[type=submit]");
    submit.disabled = true; submit.textContent = "Logging in...";
    const { error } = await client.auth.signInWithPassword({ email: data.email.trim(), password: data.password });
    submit.disabled = false; submit.textContent = "Log in";
    if (error) { message("Login failed. Check your email, password, and email confirmation."); return; }
    window.location.href = "dashboard.html";
  });

  const getSignedInProfile = async () => {
    if (!configured()) return null;
    const { data: { user } } = await client.auth.getUser();
    if (!user) { window.location.href = "login.html"; return null; }
    const { data: profile, error } = await client.from("profiles").select("*").eq("id", user.id).single();
    if (error) { message("Your profile could not be loaded. Confirm that the Supabase database setup has been completed.", "error", "#dashboard-message"); return null; }
    if (profile.status !== "active") {
      await client.auth.signOut();
      window.location.href = "login.html";
      return null;
    }
    return { user, profile };
  };

  const formatDate = value => value ? new Intl.DateTimeFormat("en-UG", { month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "-";

  const loadDashboard = async () => {
    const account = await getSignedInProfile(); if (!account) return;
    const { user, profile } = account;
    document.querySelector("#member-name").textContent = profile.full_name.split(" ")[0] || "Member";
    document.querySelector("#member-id").textContent = profile.member_id;
    if (profile.role === "admin") document.querySelector("#admin-link")?.classList.remove("hidden");
    const { data: contributions, error } = await client.from("contributions").select("amount, contribution_month, status, created_at").eq("member_id", user.id).order("contribution_month", { ascending: false });
    if (error) { message("Your contribution history could not be loaded.", "error", "#dashboard-message"); return; }
    const verified = contributions.filter(row => row.status === "verified");
    document.querySelector("#savings-balance").textContent = money(verified.reduce((total, row) => total + Number(row.amount), 0));
    const currentMonth = new Date().toISOString().slice(0, 7);
    const current = contributions.find(row => row.contribution_month === currentMonth);
    document.querySelector("#contribution-status").textContent = current ? current.status[0].toUpperCase() + current.status.slice(1) : "Not recorded";
    document.querySelector("#status-note").textContent = current ? "This month’s contribution" : "No contribution for this month";
    const list = document.querySelector("#contribution-list"); list.replaceChildren();
    if (!contributions.length) { list.innerHTML = '<tr><td colspan="4" class="empty-state">No contributions have been recorded yet.</td></tr>'; return; }
    contributions.forEach(row => { const tr = document.createElement("tr"); [formatDate(row.contribution_month), money(row.amount), row.status, new Date(row.created_at).toLocaleDateString("en-UG")].forEach(value => { const td = document.createElement("td"); td.textContent = value; tr.appendChild(td); }); list.appendChild(tr); });
  };

  let adminProfiles = [];
  const loadAdmin = async () => {
    const account = await getSignedInProfile(); if (!account) return;
    if (account.profile.role !== "admin") { window.location.href = "dashboard.html"; return; }
    const { data, error } = await client.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) { message("Members could not be loaded. Check the administrator database policy.", "error", "#admin-message"); return; }
    adminProfiles = data;
    const memberSelect = document.querySelector("#contribution-member");
    memberSelect.replaceChildren(new Option("Select a member", ""));
    data.forEach(member => memberSelect.add(new Option(`${member.full_name} (${member.member_id})`, member.id)));
    const list = document.querySelector("#member-list"); list.replaceChildren();
    if (!data.length) { list.innerHTML = '<tr><td colspan="6" class="empty-state">No members found.</td></tr>'; return; }
    data.forEach(member => { const tr = document.createElement("tr"); [member.full_name, member.phone, member.member_id, member.status, new Date(member.created_at).toLocaleDateString("en-UG")].forEach(value => { const td = document.createElement("td"); td.textContent = safeText(value); tr.appendChild(td); }); const actions = document.createElement("td"); const edit = document.createElement("button"); edit.className = "table-button"; edit.textContent = "Edit"; edit.addEventListener("click", () => populateMember(member)); const remove = document.createElement("button"); remove.className = "table-button danger"; remove.textContent = "Delete"; remove.addEventListener("click", () => deleteMember(member)); actions.append(edit, remove); tr.appendChild(actions); list.appendChild(tr); });
  };

  const populateMember = member => { const form = document.querySelector("#member-form"); form.elements.id.value = member.id; form.elements.full_name.value = member.full_name; form.elements.phone.value = member.phone; form.elements.status.value = member.status; form.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const deleteMember = async member => { if (!confirm(`Permanently delete ${member.full_name}'s account and member records?`)) return; const { error } = await client.functions.invoke("delete-member", { body: { memberId: member.id } }); if (error) { message("The account could not be deleted. Deploy the delete-member function and try again.", "error", "#admin-message"); return; } message("Member account deleted.", "success", "#admin-message"); loadAdmin(); };

  document.querySelector("#member-form")?.addEventListener("submit", async event => { event.preventDefault(); const form = event.currentTarget; const id = form.elements.id.value; if (!id) { message("Select a member to edit first.", "error", "#admin-message"); return; } const update = { full_name: form.elements.full_name.value.trim(), phone: form.elements.phone.value.trim(), status: form.elements.status.value }; const { error } = await client.from("profiles").update(update).eq("id", id); if (error) { message(error.message, "error", "#admin-message"); return; } message("Member updated successfully.", "success", "#admin-message"); loadAdmin(); });
  document.querySelector("#contribution-form")?.addEventListener("submit", async event => { event.preventDefault(); const form = event.currentTarget; const record = { member_id: form.elements.member_id.value, amount: Number(form.elements.amount.value), contribution_month: form.elements.contribution_month.value, status: form.elements.status.value }; const { error } = await client.from("contributions").insert(record); if (error) { message(error.message, "error", "#admin-message"); return; } message("Contribution recorded successfully.", "success", "#admin-message"); form.reset(); });

  if (page === "dashboard.html") loadDashboard();
  if (page === "admin.html") loadAdmin();
})();
