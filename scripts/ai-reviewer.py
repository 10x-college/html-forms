import os
import json
import requests
import google.generativeai as genai

# Configuration: Extensions to look for (add more if needed)
# Configuration: Comprehensive Frontend & Backend Extensions
SUPPORTED_EXTENSIONS = {
    # JavaScript / TypeScript & Flavors
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    
    # Modern Frameworks
    '.vue', '.svelte', '.astro',
    
    # Styling
    '.css', '.scss', '.sass', '.less', '.styl',
    
    # Markup & Templates
    '.html', '.htm', '.pug', '.ejs', '.handlebars', '.hbs',
    
    # Backend / Other (Optional, keep if you have full-stack repos)
    '.json', '.go', '.java', '.cpp', '.c' , '.md'
}

# Directories to ignore (Added common frontend folders like dist, build, coverage)
IGNORE_DIRS = {
    '.git', '.github', '.vscode', '.idea', 
    'node_modules', 'bower_components', 
    'dist', 'build', 'out', 'coverage', 
    '__pycache__', 'venv', 'bin', 'obj', 
    '.next', '.nuxt', '.astro' # Framework build caches
}

# Curated learning resources for different topics (AI will reference these)
LEARNING_RESOURCES = """
**HTML & Semantic Markup:**
- MDN HTML Basics: https://developer.mozilla.org/en-US/docs/Learn/HTML
- Web.dev Learn HTML: https://web.dev/learn/html

**CSS & Styling:**
- CSS-Tricks Complete Guide: https://css-tricks.com/guides/
- MDN CSS Layout: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout
- Flexbox Froggy (Game): https://flexboxfroggy.com/
- Grid Garden (Game): https://cssgridgarden.com/

**JavaScript Basics:**
- JavaScript.info (ქართულად): https://javascript.info/
- MDN JavaScript Guide: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide
- Eloquent JavaScript (Free Book): https://eloquentjavascript.net/

**Forms & Validation:**
- MDN Forms Guide: https://developer.mozilla.org/en-US/docs/Learn/Forms
- Web.dev Sign-in Form Best Practices: https://web.dev/sign-in-form-best-practices/

**Accessibility:**
- Web.dev Learn Accessibility: https://web.dev/learn/accessibility
- A11y Project Checklist: https://www.a11yproject.com/checklist/

**General Best Practices:**
- Web.dev Learn: https://web.dev/learn
- Frontend Checklist: https://frontendchecklist.io/
"""

def get_pr_commits(repo, pr_number, token):
    """Fetch all commits from a PR"""
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/commits"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def get_commit_changes(repo, commit_sha, token):
    """Fetch the files changed in a specific commit"""
    url = f"https://api.github.com/repos/{repo}/commits/{commit_sha}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def should_ignore_file(file_path):
    """Check if file should be ignored based on path or extension"""
    # Check if in ignored directory
    for ignore_dir in IGNORE_DIRS:
        if f"/{ignore_dir}/" in file_path or file_path.startswith(f"{ignore_dir}/"):
            return True
    
    # Check extension
    ext = os.path.splitext(file_path)[1]
    return ext not in SUPPORTED_EXTENSIONS

def main():
    # --- 1. SETUP ---
    gemini_key = os.getenv("GEMINI_API_KEY")
    github_token = os.getenv("GITHUB_TOKEN")

    if not gemini_key or not github_token:
        print("❌ Error: Missing API Key or Token.")
        return

    genai.configure(api_key=gemini_key)
    model = genai.GenerativeModel("gemini-2.5-pro") 

    # --- 2. GET CONTEXT ---
    repo_full_name = os.getenv("GITHUB_REPOSITORY")
    event_path = os.getenv("GITHUB_EVENT_PATH")
    
    with open(event_path, 'r') as f:
        event_data = json.load(f)
    
    if 'pull_request' in event_data:
        pr_number = event_data['pull_request']['number']
    else:
        print("⚠️ Not a Pull Request event. Ensure this runs in a PR context for comments.")
        return

    # --- 3. READ EXERCISE/TASK FILE FOR CONTEXT ---
    exercise_content = ""
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if file.lower() in ['readme.md', 'task.md', 'exercise.md', 'assignment.md']:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        exercise_content = f.read()
                        print(f"📋 Found task description: {file_path}")
                        break
                except Exception as e:
                    print(f"⚠️ Could not read {file_path}: {e}")
        if exercise_content:
            break

    # --- 4. GET COMMITS FROM PR ---
    print("🔍 Fetching commits from PR...")
    try:
        commits = get_pr_commits(repo_full_name, pr_number, github_token)
        print(f"✅ Found {len(commits)} commits")
    except Exception as e:
        print(f"❌ Error fetching commits: {e}")
        return

    # --- 5. REVIEW EACH COMMIT ---
    all_feedback = []
    
    for commit in commits:
        commit_sha = commit['sha']
        commit_message = commit['commit']['message']
        short_sha = commit_sha[:7]
        
        print(f"\n📝 Reviewing commit: {short_sha} - {commit_message}")
        
        # Get changed files in this commit
        try:
            commit_data = get_commit_changes(repo_full_name, commit_sha, github_token)
            files = commit_data.get('files', [])
        except Exception as e:
            print(f"❌ Error fetching commit changes: {e}")
            continue
        
        # Build content of changed files
        changed_content = ""
        file_count = 0
        
        for file_info in files:
            file_path = file_info['filename']
            
            # Skip ignored files
            if should_ignore_file(file_path):
                continue
            
            # Get the patch (diff)
            patch = file_info.get('patch', '')
            if patch:
                changed_content += f"\n--- FILE: {file_path} ---\n"
                changed_content += f"Status: {file_info['status']}\n"
                changed_content += f"Changes:\n{patch}\n"
                file_count += 1
        
        if file_count == 0:
            print(f"⚠️ No relevant files changed in this commit, skipping...")
            continue
        
        print(f"✅ Analyzing {file_count} changed files...")
        
        # --- 6. CREATE CONCISE MENTORING PROMPT ---
        prompt = f"""
# შენი როლი და კონტექსტი
შენ ხარ გამოცდილი ფრონტენდ-დეველოპერი მენტორი, რომელიც მუშაობს **დამწყებ ფრონტენდ სტუდენტებთან**. 
შენი ძირითადი მიზანია: არა მხოლოდ შეცდომების მითითება, არამედ სწავლის პროცესის გაადვილება და მოტივაციის გაზრდა.

# დავალების კონტექსტი
{exercise_content if exercise_content else "დავალების აღწერა არ მოიძებნა. გააანალიზე კოდი ზოგადი best practices-ის მიხედვით."}

# ამ კომიტში შეტანილი ცვლილებები
{changed_content}

# შენი ამოცანები (ზუსტად ამ თანმიმდევრობით)

## ნაბიჯი 1: გააანალიზე სტუდენტის დონე
- შეაფასე კოდის სირთულე და სტილი
- განსაზღვრე სტუდენტის სავარაუდო ცოდნის დონე (absolute beginner / beginner / intermediate beginner)
- მოერგე ენობრივ სირთულეს მის დონეს
- დამწყები = მარტივი ენა, მეტი ახსნა; გამოცდილი = უფრო ტექნიკური

## ნაბიჯი 2: იდენტიფიცირე კლიდები
- რა სწავლობს სტუდენტი ამ კომიტში? (HTML structure? CSS styling? JavaScript basics? Forms?)
- რა კონცეფციები ან ტექნოლოგიები გამოიყენა?
- რა არის მისი ძლიერი მხარე? რას სჭირდება გაუმჯობესება?

## ნაბიჯი 3: გასცი feedback (მოკლედ და კონკრეტულად)

**მნიშვნელოვანი წესები:**
- **იყავი ლაკონური**: მაქსიმუმ 5 წინადადება
- **ფოკუსირება**: მხოლოდ ამ კომიტის ცვლილებებზე
- **დაიწყე პოზიტიურით**: ყოველთვის ამოიწურე რაღაც კარგი (ეს ამაღლებს მოტივაციას)
- **კონკრეტული**: თუ რაიმე უნდა შეიცვალოს, მიუთითე ზუსტი კოდის ხაზი და როგორ
- **ახსნა რატომ**: არ დაწერო მხოლოდ "ეს ცუდია", ახსენი რა პრობლემას იწვევს
- **დამწყებისთვის**: თავიდან აიცილე ძალიან ტექნიკური ტერმინები ან დაამატე მარტივი განმარტება

## ნაბიჯი 4: რესურსების რეკომენდაცია
იდენტიფიცირებული დონისა და კონცეფციების საფუძველზე:
- შესთავაზე **1-2 კონკრეტული რესურსი** (MDN docs, web.dev, CSS-Tricks, JavaScript.info)
- რესურსი უნდა იყოს **პირდაპირ დაკავშირებული** იმ თემასთან, რაზეც სტუდენტი მუშაობს
- ენა: ქართულენოვანი რესურსები (თუ არსებობს), თორემ ინგლისური

# გამოსატანი ფორმატი (მკაცრად დაიცავი)

✅ **რა მუშაობს კარგად**
[1 წინადადება - აუცილებლად იპოვე რაღაც პოზიტიური, თუნდაც პატარა]

💡 **რჩევები**
• [კონკრეტული რჩევა 1 - მიუთითე ფაილი და რა უნდა შეიცვალოს]
• [კონკრეტული რჩევა 2 - ახსენი რატომ]
[არაუმეტეს 3 პუნქტისა]

📚 **რესურსი შემდეგი ნაბიჯისთვის**
[1-2 კონკრეტული ლინკი ან რეკომენდაცია, რომელიც დაეხმარება ზუსტად იმ კონცეფციის გაღრმავებაში, რაზეც მუშაობს]

# ხელმისაწვდომი რესურსების ბაზა
{LEARNING_RESOURCES}

---

# მაგალითი იდეალური პასუხისა

✅ **რა მუშაობს კარგად**
კარგად გამოიყენე semantic HTML-ის `<form>` და `<label>` ტეგები - ეს აუმჯობესებს accessibility-ს.

💡 **რჩევები**
• `index.html`-ში, ხაზი 15: `<button>` ელემენტს დაამატე `type="submit"` (default იქნება submit, მაგრამ ნათლად მიუთითე)
• `styles.css`-ში კლასის სახელები გახადე აღწერითი: `.btn-1` → `.submit-button` (6 თვის შემდეგ დაგავიწყდება რას ნიშნავს btn-1)

📚 **რესურსი შემდეგი ნაბიჯისთვის**
• MDN - HTML Forms Guide: https://developer.mozilla.org/en-US/docs/Learn/Forms
• ან ქართულად: https://javascript.info/forms-controls (თარგმნილია ქართულად)

---

**დაიწყე რევიუ:**
"""

        # --- 7. GET AI FEEDBACK ---
        try:
            ai_response = model.generate_content(prompt)
            feedback = ai_response.text.strip()
            
            # Format the feedback with commit info
            formatted_feedback = f"**[`{short_sha}`]** {commit_message}\n\n{feedback}"
            all_feedback.append(formatted_feedback)
            
        except Exception as e:
            print(f"❌ Gemini Error for commit {short_sha}: {e}")
            continue

    if not all_feedback:
        print("⚠️ No feedback generated for any commits.")
        return

    # --- 8. POST COMBINED COMMENT ---
    header = "🎓 **AI Mentor Review** - თითოეული კომიტის დეტალური განხილვა\n\n"
    footer = "\n\n---\n\n💡 *ეს feedback გენერირებულია AI-ის მიერ. თუ რაიმე გაურკვეველია, ჰკითხე მენტორს!*"
    combined_feedback = header + "\n\n---\n\n".join(all_feedback) + footer
    post_comment(repo_full_name, pr_number, github_token, combined_feedback)

def post_comment(repo, pr_num, token, body):
    url = f"https://api.github.com/repos/{repo}/issues/{pr_num}/comments"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {"body": f"### 🎓 კომიტების მიმოხილვა (AI Mentor)\n\n{body}"}
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 201:
        print("✅ Comment posted successfully!")
    else:
        print(f"❌ Failed to post comment: {response.status_code}")

if __name__ == "__main__":
    main()