#!/bin/bash
# 启动项目日志API服务器
# 用于支持智能生成日志功能

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/project-summary"
SERVER_SCRIPT="$PROJECT_DIR/auto-log-server.js"
PID_FILE="$PROJECT_DIR/auto-log-server.pid"
LOG_FILE="$PROJECT_DIR/auto-log-server.log"

# 解析脚本自身绝对路径，确保 start/stop/restart 自调用时 $0 始终可用
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)/$(basename "${BASH_SOURCE[0]}")"

case "$1" in
    start)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p $PID > /dev/null 2>&1; then
                echo "❌ 服务器已在运行 (PID: $PID)"
                exit 1
            else
                rm -f "$PID_FILE"
            fi
        fi

        echo "🚀 启动项目日志API服务器..."
        nohup node "$SERVER_SCRIPT" >> "$LOG_FILE" 2>&1 &
        echo $! > "$PID_FILE"
        sleep 2

        if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
            echo "✅ 服务器启动成功 (PID: $(cat "$PID_FILE"))"
            echo "📋 日志文件: $LOG_FILE"
            echo "🌐 API地址: http://localhost:3003"
        else
            echo "❌ 服务器启动失败，请查看日志: $LOG_FILE"
            rm -f "$PID_FILE"
            exit 1
        fi
        ;;

    stop)
        if [ ! -f "$PID_FILE" ]; then
            echo "❌ 服务器未运行"
            exit 1
        fi

        PID=$(cat "$PID_FILE")
        echo "🛑 停止服务器 (PID: $PID)..."
        kill $PID 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ 服务器已停止"
        ;;

    restart)
        bash "$SCRIPT_PATH" stop
        sleep 1
        bash "$SCRIPT_PATH" start
        ;;

    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p $PID > /dev/null 2>&1; then
                echo "✅ 服务器运行中 (PID: $PID)"
                echo "🌐 API地址: http://localhost:3003"
            else
                echo "❌ PID文件存在但进程不存在"
                rm -f "$PID_FILE"
            fi
        else
            echo "❌ 服务器未运行"
        fi
        ;;

    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "❌ 日志文件不存在: $LOG_FILE"
        fi
        ;;

    *)
        echo "用法: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动服务器"
        echo "  stop    - 停止服务器"
        echo "  restart - 重启服务器"
        echo "  status  - 查看运行状态"
        echo "  logs    - 查看实时日志"
        exit 1
        ;;
esac
