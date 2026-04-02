"""
Run with: python manage.py shell < apps/resources/seed_real_resources.py
"""
from apps.resources.models import Resource, ResourceCategory

cats = [
    {'name': 'Stress & Anxiety',     'icon': '😰', 'color': '#EBF3EC', 'slug': 'stress-anxiety'},
    {'name': 'Depression',           'icon': '💙', 'color': '#EBF8FF', 'slug': 'depression'},
    {'name': 'Sleep & Rest',         'icon': '😴', 'color': '#F0EBF4', 'slug': 'sleep-rest'},
    {'name': 'Academic Pressure',    'icon': '📚', 'color': '#FBF5E0', 'slug': 'academic-pressure'},
    {'name': 'Crisis & Emergency',   'icon': '🆘', 'color': '#FFF5F5', 'slug': 'crisis-emergency'},
    {'name': 'Mindfulness',          'icon': '🧘', 'color': '#F0FFF4', 'slug': 'mindfulness'},
]

for c in cats:
    ResourceCategory.objects.get_or_create(slug=c['slug'], defaults=c)

stress = ResourceCategory.objects.get(slug='stress-anxiety')
depression = ResourceCategory.objects.get(slug='depression')
sleep = ResourceCategory.objects.get(slug='sleep-rest')
academic = ResourceCategory.objects.get(slug='academic-pressure')
crisis = ResourceCategory.objects.get(slug='crisis-emergency')
mindfulness = ResourceCategory.objects.get(slug='mindfulness')

resources = [
    # Stress & Anxiety
    {
        'title': 'Managing Academic Stress: A Student Guide',
        'slug': 'managing-academic-stress',
        'category': stress,
        'content_type': 'article',
        'description': 'Practical, evidence-based techniques to cope with exam pressure, deadlines, and academic challenges.',
        'content': '''Academic stress is one of the most common mental health challenges among university students. 

**Understanding Your Stress Response**
When you feel overwhelmed, your body activates the "fight-or-flight" response. While this can be useful in short bursts, chronic activation leads to burnout, poor sleep, and declining performance.

**The Pomodoro Technique**
Work in focused 25-minute sessions followed by 5-minute breaks. After 4 sessions, take a 20-minute break. This prevents mental fatigue and maintains concentration.

**Time Blocking**
Divide your day into blocks dedicated to specific tasks. Use a calendar app to schedule study time, breaks, meals, and social activities. Seeing your day structured reduces anxiety about "not doing enough."

**The 5-4-3-2-1 Grounding Technique**
When anxiety spikes: identify 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. This anchors you in the present moment.

**Progressive Muscle Relaxation**
Tense each muscle group for 5 seconds, then release. Start from your toes and work upward. Practice before bed or before exams.

**Seeking Help**
If stress is significantly impacting your daily life, don't hesitate to reach out to a counselor. Early intervention is always more effective than waiting until you're overwhelmed.''',
        'read_time_minutes': 8,
        'is_featured': True,
        'is_published': True,
        'external_url': 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/stress/',
    },
    # Anxiety
    {
        'title': 'Understanding Anxiety: What It Is and What Helps',
        'slug': 'understanding-anxiety',
        'category': stress,
        'content_type': 'article',
        'description': 'A clear explanation of anxiety symptoms and proven coping strategies backed by research.',
        'content': '''Anxiety is your brain's alarm system. It becomes a problem when it fires too often or too intensely.

**Types of Anxiety**
- Generalized Anxiety Disorder (GAD): persistent worry about multiple things
- Social Anxiety: intense fear of social situations and judgment
- Panic Disorder: sudden episodes of intense fear with physical symptoms

**Physical Symptoms**
Rapid heartbeat, sweating, trembling, shortness of breath, nausea, dizziness. These are real physical responses, not "just in your head."

**The Worry Time Technique**
Schedule 20 minutes per day as your "worry time." When anxious thoughts arise outside this window, write them down and postpone them to your scheduled time. This breaks the cycle of constant rumination.

**Breathing Techniques**
Box breathing: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 4 times. This activates your parasympathetic nervous system.

**Cognitive Restructuring**
Challenge anxious thoughts: "What's the evidence for this fear? What's the worst realistic outcome? How would I cope?"

**When to Seek Professional Help**
If anxiety is preventing you from attending classes, socializing, or completing daily tasks, please speak with a counselor. Cognitive Behavioral Therapy (CBT) is highly effective.''',
        'read_time_minutes': 7,
        'is_featured': False,
        'is_published': True,
        'external_url': 'https://www.anxietyanddepressionassociation.org',
    },
    # Depression
    {
        'title': 'Recognizing and Dealing with Depression',
        'slug': 'recognizing-depression',
        'category': depression,
        'content_type': 'article',
        'description': 'How to identify depression symptoms in yourself or a friend, and what steps to take.',
        'content': '''Depression is more than feeling sad. It is a medical condition that affects how you think, feel, and function.

**Common Symptoms**
- Persistent sadness, emptiness, or hopelessness
- Loss of interest in activities you once enjoyed
- Changes in sleep (too much or too little)
- Changes in appetite and weight
- Difficulty concentrating, remembering, or making decisions
- Fatigue and loss of energy
- Feelings of worthlessness or excessive guilt
- Thoughts of death or suicide

**What Depression Is NOT**
Depression is not weakness. It is not something you can "snap out of." It is not a character flaw. It is a health condition, just like diabetes or hypertension.

**Behavioral Activation**
One of the most effective early interventions: do small activities even when you don't feel like it. Start with 5 minutes of walking, one social interaction, one small task. Momentum builds over time.

**Social Connection**
Isolation worsens depression. Even when it feels hard, maintaining connections is protective. Tell someone you trust how you're feeling.

**Professional Treatment**
Depression responds well to treatment. Therapy (especially CBT), medication, or a combination are highly effective. Please reach out to a counselor — you do not have to face this alone.

**If you're in crisis:** Contact your local emergency services or a crisis line immediately.''',
        'read_time_minutes': 9,
        'is_featured': True,
        'is_published': True,
        'external_url': 'https://www.who.int/news-room/fact-sheets/detail/depression',
    },
    # Sleep
    {
        'title': 'Sleep Hygiene for Students: A Practical Guide',
        'slug': 'sleep-hygiene-students',
        'category': sleep,
        'content_type': 'guide',
        'description': 'Evidence-based tips to improve your sleep quality and wake up feeling genuinely rested.',
        'content': '''Sleep is not a luxury. It is a biological necessity. Most university students are chronically sleep-deprived, which impairs memory, decision-making, emotional regulation, and immune function.

**The Science of Sleep**
During sleep, your brain consolidates memories (moving learning from short-term to long-term storage), clears metabolic waste products, and restores energy. 7-9 hours is the recommended range for adults.

**The 10 Rules of Sleep Hygiene**
1. Keep a consistent sleep schedule — even on weekends
2. Create a dark, cool, quiet sleep environment (18-20°C is ideal)
3. Avoid screens 1 hour before bed (blue light suppresses melatonin)
4. Avoid caffeine after 2pm
5. Avoid alcohol — it fragments sleep architecture
6. Use your bed only for sleep (not studying or scrolling)
7. Exercise regularly, but not within 3 hours of bedtime
8. Establish a wind-down routine (reading, stretching, warm shower)
9. If you can't sleep after 20 minutes, get up and do something calm until sleepy
10. Avoid long naps (>30 min) and naps after 3pm

**Sleep and Mental Health**
Poor sleep and mental health have a bidirectional relationship: anxiety and depression worsen sleep, and poor sleep worsens anxiety and depression. Fixing sleep is often one of the fastest ways to improve mood.

**When to Seek Help**
If you have persistent insomnia (difficulty sleeping more than 3 nights per week for more than 3 months), speak to a healthcare professional. Cognitive Behavioral Therapy for Insomnia (CBT-I) is more effective than sleep medication.''',
        'read_time_minutes': 6,
        'is_featured': False,
        'is_published': True,
        'external_url': 'https://www.sleepfoundation.org/sleep-hygiene',
    },
    # Academic
    {
        'title': 'Preventing Burnout: Warning Signs and Recovery',
        'slug': 'preventing-burnout',
        'category': academic,
        'content_type': 'article',
        'description': 'How to recognize academic burnout before it derails your studies, and how to recover from it.',
        'content': '''Burnout is a state of chronic stress that leads to physical and emotional exhaustion, cynicism, and feelings of ineffectiveness.

**Three Dimensions of Burnout**
1. Exhaustion: feeling depleted and overextended
2. Cynicism/Depersonalization: emotional distance from your studies or detachment
3. Inefficacy: feeling incompetent and lacking achievement

**Warning Signs**
- Dreading going to class or opening your textbooks
- Feeling like nothing you do matters
- Physical symptoms: headaches, frequent illness, exhaustion despite rest
- Increased irritability and decreased patience
- Difficulty feeling satisfaction even when you do well

**Prevention Strategies**
- Set boundaries: schedule non-negotiable rest, social time, hobbies
- Practice self-compassion: you are not a productivity machine
- Connect with purpose: remind yourself why you're studying
- Reach out early: don't wait until you're empty before asking for help

**Recovery**
Recovery from burnout takes time. Key steps: remove/reduce stressors where possible, restore your energy (sleep, nutrition, movement), reconnect with what energizes you, and seek professional support.

**Talking to Your Counselor**
A counselor can help you develop a sustainable academic plan, set appropriate expectations, and work through underlying perfectionism or fear of failure that often drives burnout.''',
        'read_time_minutes': 10,
        'is_featured': True,
        'is_published': True,
        'external_url': 'https://hbr.org/2016/11/beating-burnout',
    },
    # Crisis
    {
        'title': 'Crisis Resources & Emergency Contacts',
        'slug': 'crisis-resources',
        'category': crisis,
        'content_type': 'guide',
        'description': 'Immediate resources if you or someone you know is in mental health crisis. Read this first.',
        'content': '''If you are in immediate danger, call emergency services (911 or local equivalent) now.

**If You Are Having Thoughts of Suicide**
You are not alone. These thoughts are a symptom of overwhelming pain, not a reflection of reality or your future.

Please reach out immediately:
- **Your MindMate Counselor** — message them directly in this app
- **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/
- **Crisis Text Line (if available in your country):** Text HOME to 741741
- **Campus Health Services:** Visit in person — they are equipped to help

**If a Friend Is in Crisis**
- Stay with them — do not leave them alone
- Listen without judgment
- Ask directly: "Are you thinking about suicide?" — this does not plant the idea
- Remove access to lethal means if safely possible
- Help them contact a counselor or emergency services

**Warning Signs in Others**
- Talking about wanting to die or feeling hopeless
- Withdrawing from friends and activities
- Giving away possessions
- Saying goodbye as if they won't see you again
- Sudden calmness after a period of depression (may indicate a decision has been made)

**After a Crisis**
Follow-up support is critical. Help your friend or yourself stay connected to professional care. Recovery is possible.

**Your MindMate counselors are available through this app. Please reach out — that is what we are here for.**''',
        'read_time_minutes': 4,
        'is_featured': True,
        'is_published': True,
        'external_url': 'https://www.iasp.info/resources/Crisis_Centres/',
    },
    # Mindfulness
    {
        'title': 'Introduction to Mindfulness Meditation',
        'slug': 'intro-mindfulness',
        'category': mindfulness,
        'content_type': 'guide',
        'description': 'A beginner-friendly guide to starting a daily mindfulness practice with proven mental health benefits.',
        'content': '''Mindfulness is the practice of paying deliberate, non-judgmental attention to the present moment. It has strong scientific evidence for reducing anxiety, depression, and stress.

**What Mindfulness Is NOT**
- It is not emptying your mind
- It is not religious (though it has roots in Buddhist practice)
- It does not require special equipment or a lot of time
- You do not have to feel calm to practice it

**The Basic Breath Meditation (5 minutes)**
1. Sit comfortably with your back straight
2. Close your eyes or soften your gaze downward
3. Breathe naturally and focus your attention on the physical sensations of breathing
4. When your mind wanders (it will — that's normal), gently return your attention to your breath
5. Do this for 5 minutes to start

**Body Scan Meditation**
Lie down. Slowly move your attention from your toes to the top of your head, noticing sensations without judgment. Takes 10-20 minutes. Excellent for sleep and stress relief.

**Mindful Eating**
Eat one meal per day without screens. Notice the taste, texture, smell of each bite. Chew slowly. This trains present-moment awareness and improves digestion.

**Apps and Resources**
- Insight Timer (free): thousands of guided meditations
- Headspace (discounted for students)
- YouTube: search "5 minute guided mindfulness meditation"

**Building the Habit**
Attach mindfulness practice to an existing habit: right after brushing teeth in the morning, or before opening your laptop. Start with 5 minutes. Consistency matters more than duration.''',
        'read_time_minutes': 7,
        'is_featured': False,
        'is_published': True,
        'external_url': 'https://www.mindful.org/how-to-meditate/',
    },
]

created = 0
for r in resources:
    obj, made = Resource.objects.get_or_create(slug=r['slug'], defaults=r)
    if made:
        created += 1

print(f"✅ Seeded {created} new resources ({len(resources) - created} already existed)")


