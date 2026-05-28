import base64, os

OUT = "/Users/yxq/Downloads/opencode project1/schedule/src/components/ScheduleView.tsx"

# Each block is a section of the TSX file, base64-encoded to avoid parser issues

b1 = "aW1wb3J0IHsgdXNlU3RhdGUsIHVzZU1lbW8sIHVzZUNhbGxiYWNrIH0gZnJvbSAncmVhY3QnCmltcG9ydCB7IHVzZVN0b3JlLCBnZW5JZCB9IGZyb20gJy4uL3N0b3JlJwppbXBvcnQgeyBnZW5lcmF0ZVNjaGVkdWxlLCBmaW5kQ29uZmxpY3RzIH0gZnJvbSAnLi4vYWxnb3JpdGhtL3NjaGVkdWxlcicKaW1wb3J0IHsgREFZUywgUEVSSU9EUyB9IGZyb20gJy4uL3R5cGVzJwppbXBvcnQgdHlwZSB7IFNjaGVkdWxlRW50cnkgfSBmcm9tICcuLi90eXBlcycK"
raw = base64.b64decode(b1).decode()

with open(OUT, "w") as f:
    f.write(raw)
print(f"Wrote b1 ({len(raw)} chars)")