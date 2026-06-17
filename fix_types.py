import re

with open('src/components/NotificationBell.tsx', 'r') as f:
    content = f.read()

content = content.replace('!n.is_read', '!n.read_at')
content = content.replace('is_read: true, ', '')
content = content.replace('.eq("is_read", false)', '.is_null("read_at")')
content = content.replace('n.is_read', 'n.read_at')

with open('src/components/NotificationBell.tsx', 'w') as f:
    f.write(content)
