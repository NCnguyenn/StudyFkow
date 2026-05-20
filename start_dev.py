import subprocess
import sys
import os
import signal
import time

def main():
    processes = []
    
    print("🚀 Starting AI StudyFlow Development Environment...")
    
    try:
        # 1. Start Docker Containers
        print("🐳 Starting Docker dependencies...")
        subprocess.run(["docker-compose", "up", "-d"], check=True)
        
        # 2. Start FastAPI Backend
        print("🐍 Starting FastAPI Backend (Port 8000)...")
        backend_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--reload", "--port", "8000"],
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        processes.append(backend_proc)
        
        # 3. Start Celery Worker
        print("👷 Starting Celery Worker...")
        celery_proc = subprocess.Popen(
            [sys.executable, "-m", "celery", "-A", "backend.app.core.celery_app", "worker", "--loglevel=info", "-P", "solo"],
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        processes.append(celery_proc)
        
        # 4. Start Next.js Frontend
        print("⚛️  Starting Next.js Frontend (Port 3000)...")
        frontend_dir = os.path.join(os.getcwd(), "frontend")
        frontend_proc = subprocess.Popen(
            "npm run dev",
            cwd=frontend_dir,
            shell=True,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        processes.append(frontend_proc)
        
        print("\n✅ All services are starting up!")
        print("📝 Backend: http://localhost:8000")
        print("💻 Frontend: http://localhost:3000")
        print("\n🛑 Press Ctrl+C to stop all services.\n")
        
        # Keep the main script alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping all services...")
        for proc in processes:
            print(f"Terminating process {proc.pid}...")
            proc.terminate()
            
        # Optional: Wait for them to shut down
        for proc in processes:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"Process {proc.pid} didn't stop in time, killing it...")
                proc.kill()
                
        print("✨ Environment shut down successfully.")

if __name__ == "__main__":
    main()
