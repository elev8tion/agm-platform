# budget.py
import json, os

PATH = os.path.join('config', 'budget_state.json')
LIMITS_PATH = os.path.join('config', 'budget.json')

class Budget:
    def __init__(self):
        # Defaults (in case config missing)
        self.cfg = {
            "limits": {
                "web_search_calls": 200,
                "file_search_calls": 1000,
                "code_interpreter_sessions": 12,
                "dollars_cap": 20
            }
        }
        if os.path.exists(LIMITS_PATH):
            try:
                with open(LIMITS_PATH) as f:
                    self.cfg = json.load(f)
            except Exception:
                pass
        self.state = {"web_search": 0, "file_search": 0, "code_interp": 0, "cost": 0.0}
        if os.path.exists(PATH):
            try:
                self.state.update(json.load(open(PATH)))
            except Exception:
                pass

    def save(self):
        try:
            json.dump(self.state, open(PATH, "w"))
        except Exception:
            pass

    def allow(self, kind, inc=1):
        kind_map = {"web": "web_search", "file": "file_search", "ci": "code_interp"}
        if kind not in kind_map:
            return False
        key = kind_map[kind]
        # Figure the limit key
        if key == "code_interp":
            limit_key = "code_interpreter_sessions"
        else:
            limit_key = f"{key}_calls"
        limit = self.cfg["limits"].get(limit_key, 0)
        if self.state[key] + inc > limit:
            return False
        self.state[key] += inc
        self.save()
        return True

    def add_cost(self, dollars):
        try:
            self.state["cost"] += float(dollars)
        except Exception:
            pass
        self.save()
        return self.state["cost"] <= float(self.cfg["limits"].get("dollars_cap", 0))

BUDGET = Budget()
