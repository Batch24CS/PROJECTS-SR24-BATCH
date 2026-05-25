# main.py - SPAM Fitness
from gui_dashboard import SPAMFitnessDashboard
import tkinter as tk

def main():
    print("Starting SPAM Fitness...")
    root = tk.Tk()
    root.withdraw()  # Hide window during setup
    root.update()
    app = SPAMFitnessDashboard(root)
    root.deiconify()
    print("Application started")
    root.mainloop()

    print("Application closed")


if __name__ == "__main__":
    main()