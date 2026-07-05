# tutorial_service.py
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import logging

from models import (
    Tutorial, TutorialCompletion, UserTutorialProgress, 
    TutorialView, TutorialComment, TutorialLike, TutorialBookmark,
    TutorialCategory as TutorialCategoryModel, TutorialTag, TutorialTagMapping
)

logger = logging.getLogger(__name__)

# ==================== Tutorial Service Class ====================

class TutorialService:
    """Service class for handling tutorial operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_tutorials(
        self,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        level: Optional[str] = None,
        search: Optional[str] = None,
        views: Optional[int] = None,
        limit: int = 9,
        offset: int = 0,
        in_progress: bool = False,
        ids: Optional[List[str]] = None,
        order_by: str = "created_at",
        order_direction: str = "desc",
        is_premium: Optional[bool] = None  # ADD THIS PARAMETER
    ) -> Dict[str, Any]:
        """
        Fetch tutorials with filters and pagination
        """
        try:
            # Build base query
            query = self.db.query(Tutorial).filter(
                Tutorial.status == "published"
            )
            
            # ADD is_premium filter
            if is_premium is not None:
                query = query.filter(Tutorial.is_premium == is_premium)
            
            # Apply other filters...
            if category and category != "all":
                query = query.filter(Tutorial.category == category)
            
            if level and level != "all":
                query = query.filter(Tutorial.level == level)
            
            if ids:
                query = query.filter(Tutorial.id.in_(ids))
            
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    or_(
                        Tutorial.title.ilike(search_term),
                        Tutorial.description.ilike(search_term)
                    )
                )
            
            # In-progress filter
            if in_progress and user_id:
                progress_subquery = self.db.query(
                    UserTutorialProgress.tutorial_id
                ).filter(
                    UserTutorialProgress.user_id == user_id,
                    UserTutorialProgress.progress_percentage > 0,
                    UserTutorialProgress.progress_percentage < 100
                ).subquery()
                
                query = query.filter(
                    Tutorial.id.in_(progress_subquery)
                )
            
            # Get total count before pagination
            total = query.count()
            
            # Apply ordering
            order_column = getattr(Tutorial, order_by, Tutorial.created_at)
            if order_direction.lower() == "asc":
                query = query.order_by(order_column.asc())
            else:
                query = query.order_by(order_column.desc())
            
            # Apply pagination
            tutorials = query.offset(offset).limit(limit).all()
            
            # Get user progress if user_id provided
            user_progress = {}
            if user_id and tutorials:
                progress_records = self.db.query(UserTutorialProgress).filter(
                    UserTutorialProgress.user_id == user_id,
                    UserTutorialProgress.tutorial_id.in_([t.id for t in tutorials])
                ).all()
                
                for p in progress_records:
                    user_progress[str(p.tutorial_id)] = {
                        "current_section": p.current_section,
                        "completed_sections": p.completed_sections,
                        "progress_percentage": p.progress_percentage,
                        "started_at": p.started_at,
                        "completed_at": p.completed_at,
                        "last_watched_at": p.last_watched_at
                    }
            
            # Get user bookmarks if user_id provided
            bookmarks = []
            if user_id and tutorials:
                bookmark_records = self.db.query(TutorialBookmark).filter(
                    TutorialBookmark.user_id == user_id,
                    TutorialBookmark.tutorial_id.in_([t.id for t in tutorials])
                ).all()
                bookmarks = [str(b.tutorial_id) for b in bookmark_records]
            
            # Transform to response format
            result = []
            for tutorial in tutorials:
                tutorial_dict = self._tutorial_to_dict(tutorial)
                
                # Add user-specific data
                if user_id:
                    tutorial_dict["user_progress"] = user_progress.get(str(tutorial.id))
                    tutorial_dict["is_bookmarked"] = str(tutorial.id) in bookmarks
                
                result.append(tutorial_dict)
            
            return {
                "tutorials": result,
                "total": total,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Error fetching tutorials: {str(e)}")
            raise
    
    
    def get_tutorial_by_id(
        self,
        tutorial_id: str,
        user_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get a single tutorial by ID with user progress"""
        try:
            tutorial = self.db.query(Tutorial).filter(
                Tutorial.id == tutorial_id,
                Tutorial.status == "published"
            ).first()
            
            if not tutorial:
                return None
            
            result = self._tutorial_to_dict(tutorial)
            
            # Get user progress if user_id provided
            if user_id:
                progress = self.db.query(UserTutorialProgress).filter(
                    UserTutorialProgress.tutorial_id == tutorial_id,
                    UserTutorialProgress.user_id == user_id
                ).first()
                
                if progress:
                    result["user_progress"] = {
                        "current_section": progress.current_section,
                        "completed_sections": progress.completed_sections,
                        "progress_percentage": progress.progress_percentage,
                        "started_at": progress.started_at,
                        "completed_at": progress.completed_at,
                        "last_watched_at": progress.last_watched_at
                    }
                
                # Check if bookmarked
                bookmark = self.db.query(TutorialBookmark).filter(
                    TutorialBookmark.tutorial_id == tutorial_id,
                    TutorialBookmark.user_id == user_id
                ).first()
                result["is_bookmarked"] = bool(bookmark)
                
                # Check if liked
                like = self.db.query(TutorialLike).filter(
                    TutorialLike.tutorial_id == tutorial_id,
                    TutorialLike.user_id == user_id
                ).first()
                result["is_liked"] = bool(like)
                
                # Check if completed
                completion = self.db.query(TutorialCompletion).filter(
                    TutorialCompletion.tutorial_id == tutorial_id,
                    TutorialCompletion.user_id == user_id
                ).first()
                result["is_completed"] = bool(completion)
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching tutorial {tutorial_id}: {str(e)}")
            raise

    def get_categories(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all tutorial categories with counts"""
        try:
            categories = self.db.query(
                Tutorial.category,
                func.count(Tutorial.id).label('count')
            ).filter(
                Tutorial.status == "published"
            ).group_by(Tutorial.category).all()
            
            result = []
            for cat in categories:
                result.append({
                    "name": cat.category,
                    "count": cat.count
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching categories: {str(e)}")
            return []

    def update_tutorial_progress(
        self,
        tutorial_id: str,
        user_id: str,
        current_section: int,
        completed_sections: List[int],
        progress_percentage: int
    ) -> Dict[str, Any]:
        """Update or create user progress for a tutorial"""
        try:
            # Check if tutorial exists
            tutorial = self.db.query(Tutorial).filter(
                Tutorial.id == tutorial_id,
                Tutorial.status == "published"
            ).first()
            
            if not tutorial:
                raise ValueError("Tutorial not found")
            
            # Find existing progress
            progress = self.db.query(UserTutorialProgress).filter(
                UserTutorialProgress.tutorial_id == tutorial_id,
                UserTutorialProgress.user_id == user_id
            ).first()
            
            if progress:
                # Update existing
                progress.current_section = current_section
                progress.completed_sections = completed_sections
                progress.progress_percentage = progress_percentage
                progress.last_watched_at = datetime.now(timezone.utc)
                
                if progress_percentage == 100:
                    progress.completed_at = datetime.now(timezone.utc)
            else:
                # Create new
                progress = UserTutorialProgress(
                    id=str(uuid.uuid4()),
                    tutorial_id=tutorial_id,
                    user_id=user_id,
                    current_section=current_section,
                    completed_sections=completed_sections,
                    progress_percentage=progress_percentage,
                    started_at=datetime.now(timezone.utc),
                    last_watched_at=datetime.now(timezone.utc)
                )
                self.db.add(progress)
            
            # If 100% complete, add to completions table
            if progress_percentage == 100:
                completion = self.db.query(TutorialCompletion).filter(
                    TutorialCompletion.tutorial_id == tutorial_id,
                    TutorialCompletion.user_id == user_id
                ).first()
                
                if not completion:
                    completion = TutorialCompletion(
                        id=str(uuid.uuid4()),
                        tutorial_id=tutorial_id,
                        user_id=user_id,
                        completed_at=datetime.now(timezone.utc)
                    )
                    self.db.add(completion)
            
            self.db.commit()
            self.db.refresh(progress)
            
            return {
                "tutorial_id": str(progress.tutorial_id),
                "current_section": progress.current_section,
                "completed_sections": progress.completed_sections,
                "progress_percentage": progress.progress_percentage,
                "started_at": progress.started_at,
                "completed_at": progress.completed_at,
                "last_watched_at": progress.last_watched_at
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating progress: {str(e)}")
            raise

    def toggle_bookmark(
        self,
        tutorial_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Toggle bookmark status for a tutorial"""
        try:
            # Check if tutorial exists
            tutorial = self.db.query(Tutorial).filter(
                Tutorial.id == tutorial_id,
                Tutorial.status == "published"
            ).first()
            
            if not tutorial:
                raise ValueError("Tutorial not found")
            
            # Find existing bookmark
            bookmark = self.db.query(TutorialBookmark).filter(
                TutorialBookmark.tutorial_id == tutorial_id,
                TutorialBookmark.user_id == user_id
            ).first()
            
            if bookmark:
                # Remove bookmark
                self.db.delete(bookmark)
                self.db.commit()
                return {
                    "is_bookmarked": False,
                    "message": "Bookmark removed"
                }
            else:
                # Add bookmark
                bookmark = TutorialBookmark(
                    id=str(uuid.uuid4()),
                    tutorial_id=tutorial_id,
                    user_id=user_id,
                    created_at=datetime.now(timezone.utc)
                )
                self.db.add(bookmark)
                self.db.commit()
                return {
                    "is_bookmarked": True,
                    "message": "Bookmark added"
                }
                
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error toggling bookmark: {str(e)}")
            raise

    def toggle_like(
        self,
        tutorial_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Toggle like status for a tutorial"""
        try:
            # Check if tutorial exists
            tutorial = self.db.query(Tutorial).filter(
                Tutorial.id == tutorial_id,
                Tutorial.status == "published"
            ).first()
            
            if not tutorial:
                raise ValueError("Tutorial not found")
            
            # Find existing like
            like = self.db.query(TutorialLike).filter(
                TutorialLike.tutorial_id == tutorial_id,
                TutorialLike.user_id == user_id
            ).first()
            
            if like:
                # Remove like
                self.db.delete(like)
                tutorial.likes = max(0, tutorial.likes - 1)
                self.db.commit()
                return {
                    "is_liked": False,
                    "likes": tutorial.likes,
                    "message": "Like removed"
                }
            else:
                # Add like
                like = TutorialLike(
                    id=str(uuid.uuid4()),
                    tutorial_id=tutorial_id,
                    user_id=user_id,
                    liked=True,
                    created_at=datetime.now(timezone.utc)
                )
                self.db.add(like)
                tutorial.likes += 1
                self.db.commit()
                return {
                    "is_liked": True,
                    "likes": tutorial.likes,
                    "message": "Like added"
                }
                
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error toggling like: {str(e)}")
            raise

    def track_view(
        self,
        tutorial_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Track a tutorial view"""
        try:
            # Check if tutorial exists
            tutorial = self.db.query(Tutorial).filter(
                Tutorial.id == tutorial_id,
                Tutorial.status == "published"
            ).first()
            
            if not tutorial:
                raise ValueError("Tutorial not found")
            
            # Check if user already viewed this tutorial
            view = self.db.query(TutorialView).filter(
                TutorialView.tutorial_id == tutorial_id,
                TutorialView.user_id == user_id
            ).first()
            
            if not view:
                # Create new view
                view = TutorialView(
                    id=str(uuid.uuid4()),
                    tutorial_id=tutorial_id,
                    user_id=user_id,
                    viewed_at=datetime.now(timezone.utc),
                    duration_watched=0
                )
                self.db.add(view)
                tutorial.views += 1
                self.db.commit()
            
            return {
                "message": "View tracked successfully"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error tracking view: {str(e)}")
            raise

    def track_watch_time(
        self,
        tutorial_id: str,
        user_id: str,
        duration_watched: int
    ) -> Dict[str, Any]:
        """Track watch time for a tutorial"""
        try:
            # Check if tutorial exists
            tutorial = self.db.query(Tutorial).filter(
                Tutorial.id == tutorial_id,
                Tutorial.status == "published"
            ).first()
            
            if not tutorial:
                raise ValueError("Tutorial not found")
            
            # Find or create view
            view = self.db.query(TutorialView).filter(
                TutorialView.tutorial_id == tutorial_id,
                TutorialView.user_id == user_id
            ).first()
            
            if view:
                view.duration_watched += duration_watched
                view.viewed_at = datetime.now(timezone.utc)
            else:
                view = TutorialView(
                    id=str(uuid.uuid4()),
                    tutorial_id=tutorial_id,
                    user_id=user_id,
                    duration_watched=duration_watched,
                    viewed_at=datetime.now(timezone.utc)
                )
                self.db.add(view)
            
            self.db.commit()
            
            return {
                "duration_watched": view.duration_watched,
                "message": "Watch time tracked"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error tracking watch time: {str(e)}")
            raise

    def rate_tutorial(
        self,
        tutorial_id: str,
        user_id: str,
        rating: int
    ) -> Dict[str, Any]:
        """Rate a tutorial"""
        try:
            # Check if tutorial exists
            tutorial = self.db.query(Tutorial).filter(
                Tutorial.id == tutorial_id,
                Tutorial.status == "published"
            ).first()
            
            if not tutorial:
                raise ValueError("Tutorial not found")
            
            if rating < 0 or rating > 5:
                raise ValueError("Rating must be between 0 and 5")
            
            # For now, just update the average rating
            # In production, use a separate ratings table
            old_rating = tutorial.rating or 0
            old_count = tutorial.views or 0
            
            # Simple average calculation
            new_total = (old_rating * old_count) + rating
            new_count = old_count + 1
            new_rating = new_total / new_count
            
            tutorial.rating = round(new_rating, 1)
            tutorial.views = new_count
            
            self.db.commit()
            
            return {
                "rating": tutorial.rating,
                "views": tutorial.views,
                "message": "Rating submitted successfully"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error rating tutorial: {str(e)}")
            raise

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get tutorial statistics for a user"""
        try:
            # Total tutorials published
            total_tutorials = self.db.query(Tutorial).filter(
                Tutorial.status == "published"
            ).count()
            
            # Completed tutorials
            completed_count = self.db.query(TutorialCompletion).filter(
                TutorialCompletion.user_id == user_id
            ).count()
            
            # In progress tutorials
            in_progress = self.db.query(UserTutorialProgress).filter(
                UserTutorialProgress.user_id == user_id,
                UserTutorialProgress.progress_percentage > 0,
                UserTutorialProgress.progress_percentage < 100
            ).count()
            
            # Bookmarked tutorials
            bookmarked_count = self.db.query(TutorialBookmark).filter(
                TutorialBookmark.user_id == user_id
            ).count()
            
            # Average progress
            avg_progress = self.db.query(
                func.avg(UserTutorialProgress.progress_percentage)
            ).filter(
                UserTutorialProgress.user_id == user_id
            ).scalar() or 0
            
            return {
                "total_tutorials": total_tutorials,
                "completed": completed_count,
                "in_progress": in_progress,
                "bookmarked": bookmarked_count,
                "average_progress": round(avg_progress, 1),
                "completion_rate": round(
                    (completed_count / total_tutorials * 100) if total_tutorials > 0 else 0,
                    1
                )
            }
            
        except Exception as e:
            logger.error(f"Error getting user stats: {str(e)}")
            return {
                "total_tutorials": 0,
                "completed": 0,
                "in_progress": 0,
                "bookmarked": 0,
                "average_progress": 0,
                "completion_rate": 0
            }

    def get_recommended_tutorials(
        self,
        user_id: str,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """Get recommended tutorials based on user activity"""
        try:
            # Get user's completed tutorials
            completions = self.db.query(TutorialCompletion).filter(
                TutorialCompletion.user_id == user_id
            ).all()
            
            completed_ids = [c.tutorial_id for c in completions]
            
            # Get categories from completed tutorials
            categories = []
            if completed_ids:
                completed_tutorials = self.db.query(Tutorial).filter(
                    Tutorial.id.in_(completed_ids)
                ).all()
                categories = [t.category for t in completed_tutorials if t.category]
            
            # Get bookmarked tutorials
            bookmarks = self.db.query(TutorialBookmark).filter(
                TutorialBookmark.user_id == user_id
            ).all()
            bookmarked_ids = [b.tutorial_id for b in bookmarks]
            
            # Build query for recommendations
            query = self.db.query(Tutorial).filter(
                Tutorial.status == "published"
            )
            
            # Exclude completed tutorials
            if completed_ids:
                query = query.filter(Tutorial.id.notin_(completed_ids))
            
            # Exclude bookmarked ones
            if bookmarked_ids:
                query = query.filter(Tutorial.id.notin_(bookmarked_ids))
            
            # Prioritize by category if user has preferences
            if categories:
                query = query.filter(Tutorial.category.in_(categories))
            
            # Order by rating and views
            query = query.order_by(desc(Tutorial.rating), desc(Tutorial.views))
            
            recommendations = query.limit(limit).all()
            
            # If not enough recommendations, get popular ones
            if len(recommendations) < limit:
                existing_ids = [t.id for t in recommendations]
                additional_query = self.db.query(Tutorial).filter(
                    Tutorial.status == "published"
                )
                
                if existing_ids:
                    additional_query = additional_query.filter(Tutorial.id.notin_(existing_ids))
                
                if completed_ids:
                    additional_query = additional_query.filter(Tutorial.id.notin_(completed_ids))
                
                additional = additional_query.order_by(
                    desc(Tutorial.views)
                ).limit(limit - len(recommendations)).all()
                recommendations.extend(additional)
            
            # Transform to dict
            result = []
            for t in recommendations:
                tutorial_dict = self._tutorial_to_dict(t)
                if user_id:
                    tutorial_dict["is_bookmarked"] = str(t.id) in bookmarked_ids
                result.append(tutorial_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {str(e)}")
            return []

    def get_popular_tutorials(
        self,
        user_id: Optional[str] = None,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """Get most popular tutorials"""
        try:
            tutorials = self.db.query(Tutorial).filter(
                Tutorial.status == "published"
            ).order_by(desc(Tutorial.views), desc(Tutorial.likes)).limit(limit).all()
            
            # Get user bookmarks if user_id provided
            bookmarked_ids = []
            if user_id and tutorials:
                bookmarks = self.db.query(TutorialBookmark).filter(
                    TutorialBookmark.user_id == user_id,
                    TutorialBookmark.tutorial_id.in_([t.id for t in tutorials])
                ).all()
                bookmarked_ids = [b.tutorial_id for b in bookmarks]
            
            result = []
            for t in tutorials:
                tutorial_dict = self._tutorial_to_dict(t)
                if user_id:
                    tutorial_dict["is_bookmarked"] = str(t.id) in bookmarked_ids
                result.append(tutorial_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting popular tutorials: {str(e)}")
            return []

    def get_recent_tutorials(
        self,
        user_id: Optional[str] = None,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """Get most recently added tutorials"""
        try:
            tutorials = self.db.query(Tutorial).filter(
                Tutorial.status == "published"
            ).order_by(desc(Tutorial.created_at)).limit(limit).all()
            
            # Get user bookmarks if user_id provided
            bookmarked_ids = []
            if user_id and tutorials:
                bookmarks = self.db.query(TutorialBookmark).filter(
                    TutorialBookmark.user_id == user_id,
                    TutorialBookmark.tutorial_id.in_([t.id for t in tutorials])
                ).all()
                bookmarked_ids = [b.tutorial_id for b in bookmarks]
            
            result = []
            for t in tutorials:
                tutorial_dict = self._tutorial_to_dict(t)
                if user_id:
                    tutorial_dict["is_bookmarked"] = str(t.id) in bookmarked_ids
                result.append(tutorial_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting recent tutorials: {str(e)}")
            return []

    # ==================== Helper Methods ====================

    def _tutorial_to_dict(self, tutorial: Tutorial) -> Dict[str, Any]:
        """Convert Tutorial model to dictionary"""
        return {
            "id": str(tutorial.id),
            "title": tutorial.title,
            "description": tutorial.description,
            "category": tutorial.category,
            "level": tutorial.level,
            "duration": tutorial.duration,
            "duration_seconds": tutorial.duration_seconds,
            "rating": tutorial.rating or 4.5,
            "views": tutorial.views or 0,
            "likes": tutorial.likes or 0,
            "thumbnail_url": tutorial.thumbnail_url,
            "video_url": tutorial.video_url,
            "video_embed_code": tutorial.video_embed_code,
            "icon": tutorial.icon or "PlayCircle",
            "is_premium": tutorial.is_premium or False,
            "sections": tutorial.sections or [],
            "tags": tutorial.tags or [],
            "prerequisites": tutorial.prerequisites or [],
            "created_at": tutorial.created_at,
            "updated_at": tutorial.updated_at
        }


# ==================== FastAPI Endpoint Handler ====================

def get_tutorials_endpoint(
    db: Session,
    user_id: Optional[str] = None,
    category: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 9,
    offset: int = 0,
    in_progress: bool = False,
    ids: Optional[str] = None,
    order_by: str = "created_at",
    order_direction: str = "desc"
) -> Dict[str, Any]:
    """
    Endpoint handler for fetching tutorials
    
    This is the function that should be called from your FastAPI endpoint
    """
    # Parse IDs if provided
    id_list = None
    if ids:
        id_list = ids.split(',')
    
    service = TutorialService(db)
    
    return service.get_tutorials(
        user_id=user_id,
        category=category,
        level=level,
        search=search,
        limit=limit,
        offset=offset,
        in_progress=in_progress,
        ids=id_list,  # FIX: Pass the list
        order_by=order_by,
        order_direction=order_direction
    )


# ==================== Example Usage ====================

def example_usage():
    """Example of how to use the TutorialService"""
    from database import get_db
    
    # Get database session
    db = next(get_db())
    
    # Create service instance
    service = TutorialService(db)
    
    # Example 1: Get tutorials with pagination
    result = service.get_tutorials(
        user_id="user_123",
        category="design",
        level="Beginner",
        limit=9,
        offset=0
    )
    
    print(f"Found {result['total']} tutorials")
    print(f"Returned {len(result['tutorials'])} tutorials")
    
    # Example 2: Get a single tutorial
    tutorial = service.get_tutorial_by_id(
        tutorial_id="tutorial_123",
        user_id="user_123"
    )
    
    if tutorial:
        print(f"Tutorial: {tutorial['title']}")
        print(f"Progress: {tutorial.get('user_progress', {}).get('progress_percentage', 0)}%")
    
    # Example 3: Update progress
    progress = service.update_tutorial_progress(
        tutorial_id="tutorial_123",
        user_id="user_123",
        current_section=2,
        completed_sections=[0, 1],
        progress_percentage=50
    )
    
    print(f"Updated progress: {progress['progress_percentage']}%")
    
    # Example 4: Toggle bookmark
    bookmark_result = service.toggle_bookmark(
        tutorial_id="tutorial_123",
        user_id="user_123"
    )
    
    print(f"Bookmark: {bookmark_result['is_bookmarked']}")
    
    # Example 5: Get user stats
    stats = service.get_user_stats(user_id="user_123")
    print(f"Completed: {stats['completed']}")
    print(f"In Progress: {stats['in_progress']}")
    
    # Example 6: Get recommendations
    recommendations = service.get_recommended_tutorials(
        user_id="user_123",
        limit=6
    )
    print(f"Recommendations: {len(recommendations)}")
    
    
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("tutorial_service:example_usage", host="127.0.0.1", port=8002, log_level="info")